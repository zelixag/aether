// Aether Compiler - 宏转换
// 处理 $state/$derived/$effect/$store/$async 的识别和代码转换
// 支持 .ae 文件的隐式响应式：let → $state, const + reactive dep → $derived

import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

interface AetherState {
  stateVars: Map<string, NodePath<t.VariableDeclarator>>;
  derivedVars: Map<string, NodePath<t.VariableDeclarator>>;
  effectCalls: NodePath<t.Expression>[];
  macroImported: boolean;
  importPath: NodePath<t.ImportDeclaration> | null;
  _import_$state?: string;
  _import_$derived?: string;
  _import_$effect?: string;
  _import_$store?: string;
  _import_$async?: string;
  _import_$style?: string;
  _hasStore?: boolean;
  _hasAsync?: boolean;
  _needsDOM?: boolean;
  _scopeIds?: string[];
  _elCounter?: number;
  _inlinedDerived?: Set<string>;
  _jsxValidationErrors?: Array<{ type: string; message: string; loc: unknown }>;
  _implicitMode?: boolean; // .ae 文件隐式响应式模式
}

interface StateWithAether extends Record<string, unknown> {
  aether: AetherState;
  opts?: { verbose?: boolean; disableOptimizations?: boolean };
  filename?: string;
}

type VisitorFn = (
  path: NodePath<t.Node>,
  state: StateWithAether
) => void;

export const transformMacros: Record<string, VisitorFn> = {
  // ============================================
  // let count = $state(0)       →  const count = __signal(0)
  // let double = $derived(fn)   →  const double = __derived(fn)
  // let store = $store({...})   →  const store = __store({...})
  // let data = $async(fetcher)  →  const data = __async(fetcher)
  // ============================================
  variableDeclaration(path, state, t) {
    const declarations = path.node.declarations;

    for (const decl of declarations) {
      if (!t.isCallExpression(decl.init)) continue;
      if (!t.isIdentifier(decl.callee || decl.init.callee)) continue;

      const calleeName = decl.init.callee.name;

      // $state(initialValue)
      if (calleeName === state.aether._import_$state) {
        const varName = (decl.id as t.Identifier).name;
        state.aether.stateVars.set(varName, path as NodePath<t.VariableDeclarator>);
        decl.init.callee = t.identifier('__signal');
        path.node.kind = 'const';
      }

      // $derived(() => expr)
      if (calleeName === state.aether._import_$derived) {
        const varName = (decl.id as t.Identifier).name;
        state.aether.derivedVars.set(varName, path as NodePath<t.VariableDeclarator>);
        decl.init.callee = t.identifier('__derived');
        path.node.kind = 'const';
      }

      // $store({ count: 0, name: 'aether' })
      // store 不需要 .value 转换——Proxy 自动处理读写
      if (calleeName === state.aether._import_$store) {
        state.aether._hasStore = true;
        decl.init.callee = t.identifier('__store');
        path.node.kind = 'const';
      }

      // $async(() => fetch('/api'))
      // async 返回 { value, loading, error } — 通过属性访问，不需要 .value 转换
      if (calleeName === state.aether._import_$async) {
        state.aether._hasAsync = true;
        decl.init.callee = t.identifier('__async');
        path.node.kind = 'const';
      }
    }
  },

  // ============================================
  // $effect(() => { ... })  →  __effect(() => { ... })
  // ============================================
  expressionStatement(path, state, t) {
    const expr = path.node.expression;
    if (!t.isCallExpression(expr)) return;
    if (!t.isIdentifier(expr.callee)) return;

    if (expr.callee.name === state.aether._import_$effect) {
      expr.callee = t.identifier('__effect');
      state.aether.effectCalls.push(path as NodePath<t.Expression>);
    }
  },

  // ============================================
  // count = 5  →  count.value = 5
  // count += 1  →  count.value += 1
  // ============================================
  assignmentExpression(path, state, t) {
    const left = path.node.left;
    if (!t.isIdentifier(left)) return;

    const varName = left.name;
    if (!state.aether.stateVars.has(varName)) return;

    // 跳过声明处的初始化赋值
    if (isInDeclarator(path)) return;

    // count = 5  →  count.value = 5
    path.node.left = t.memberExpression(
      t.identifier(varName),
      t.identifier('value')
    );
  },

  // ============================================
  // count++  →  count.value++
  // ++count  →  ++count.value
  // count--  →  count.value--
  // ============================================
  updateExpression(path, state, t) {
    const arg = path.node.argument;
    if (!t.isIdentifier(arg)) return;

    const varName = arg.name;
    if (!state.aether.stateVars.has(varName)) return;

    path.node.argument = t.memberExpression(
      t.identifier(varName),
      t.identifier('value')
    );
  },

  // ============================================
  // count（读取）→  count.value
  // 需要排除：声明、赋值左侧、属性名、导入等
  // ============================================
  identifier(path, state, t) {
    const name = path.node.name;

    // 检查是否是 $state 或 $derived 声明的变量
    const isState = state.aether.stateVars.has(name);
    const isDerived = state.aether.derivedVars.has(name);
    if (!isState && !isDerived) return;

    // 排除不应该转换的位置
    if (shouldSkipIdentifier(path, t)) return;

    // 检查作用域：如果当前作用域有同名绑定（如函数参数），不转换
    const binding = path.scope.getBinding(name);
    if (binding) {
      // 找到宏声明时的原始路径
      const macroBindingPath = state.aether.stateVars.get(name) || state.aether.derivedVars.get(name);
      if (macroBindingPath) {
        // 如果当前绑定不是宏声明的那个变量（被局部变量遮蔽了），跳过
        const declPath = binding.path;
        if (declPath && !declPath.findParent(p => p === macroBindingPath)) {
          // 检查绑定的声明是否在宏声明的同一个 VariableDeclaration 中
          const declParent = declPath.parentPath;
          if (declParent !== macroBindingPath) {
            return;
          }
        }
      }
    }

    // 替换为 name.value
    path.replaceWith(
      t.memberExpression(
        t.identifier(name),
        t.identifier('value')
      )
    );
    path.skip(); // 避免无限递归
  },
};

// ============================================
// 辅助函数
// ============================================

function isInDeclarator(path: NodePath<t.Node>): boolean {
  let current: NodePath<t.Node> | null = path;
  while (current) {
    if (current.isVariableDeclarator()) return true;
    current = current.parentPath;
  }
  return false;
}

function shouldSkipIdentifier(path: NodePath<t.Identifier>, t: typeof import('@babel/types')) {
  const parent = path.parent;
  const parentPath = path.parentPath;

  if (!parentPath) return true;

  // 1. 变量声明中的 id
  if (parentPath.isVariableDeclarator() && path.key === 'id') return true;

  // 2. 赋值左侧（已经在 assignmentExpression 中处理）
  if (parentPath.isAssignmentExpression() && path.key === 'left') return true;

  // 3. 更新表达式的参数（已在 updateExpression 中处理）
  if (parentPath.isUpdateExpression()) return true;

  // 4. 已经是 member expression 的 object（说明已经转换过了）
  if (parentPath.isMemberExpression() && path.key === 'object') {
    // 如果已经是 x.value 的形式，跳过
    if (t.isIdentifier(parent.property, { name: 'value' })) return true;
  }

  // 5. 属性访问的 property 部分
  if (parentPath.isMemberExpression() && path.key === 'property' && !(parent as t.MemberExpression).computed) {
    return true;
  }

  // 6. 对象属性的 key
  if (parentPath.isObjectProperty() && path.key === 'key') return true;

  // 7. 导入声明
  if (parentPath.isImportSpecifier() || parentPath.isImportDeclaration()) return true;

  // 8. 函数参数声明
  if (parentPath.isFunction() && path.listKey === 'params') return true;

  // 9. $state/$derived 的调用者
  if (parentPath.isCallExpression() && path.key === 'callee') return true;

  // 10. 类型注解（TypeScript）
  if (parentPath.isTSTypeReference?.()) return true;

  return false;
}

// ============================================
// .ae 隐式响应式转换
// 规则：
//   - 所有 let 声明 → $state (自动转为 Signal)
//   - const 声明 + 初始化表达式引用了 reactive 变量 → $derived
//   - $effect 保留显式声明
// ============================================

/**
 * 隐式模式下处理变量声明
 * 在 .ae 文件中：
 *   let count = 0         → const count = __signal(0)
 *   const double = count * 2  → const double = __derived(() => count * 2)  (如果引用了 reactive 变量)
 */
export function implicitVariableDeclaration(
  path: NodePath<t.VariableDeclaration>,
  state: StateWithAether,
  t: typeof import('@babel/types')
): void {
  const declarations = path.node.declarations;

  for (const decl of declarations) {
    if (!t.isIdentifier(decl.id)) continue;
    const varName = decl.id.name;

    // 跳过没有初始值的声明
    if (!decl.init) continue;

    // 如果是显式的宏调用（$state/$derived/$store/$async），走原来的逻辑
    if (t.isCallExpression(decl.init) && t.isIdentifier(decl.init.callee)) {
      const callee = decl.init.callee.name;
      if (['$state', '$derived', '$effect', '$store', '$async',
           state.aether._import_$state, state.aether._import_$derived,
           state.aether._import_$store, state.aether._import_$async].includes(callee)) {
        return; // 让原来的 transformMacros.variableDeclaration 处理
      }
    }

    // 跳过函数声明（const handler = () => {} 不是 derived）
    if (t.isArrowFunctionExpression(decl.init) || t.isFunctionExpression(decl.init)) continue;

    // 跳过 for 循环中的 let
    if (isInForStatement(path)) continue;

    if (path.node.kind === 'let') {
      // ===== let → $state =====
      // let count = 0  →  const count = __signal(0)
      state.aether.stateVars.set(varName, path as unknown as NodePath<t.VariableDeclarator>);
      decl.init = t.callExpression(t.identifier('__signal'), [decl.init]);
      path.node.kind = 'const';
    } else if (path.node.kind === 'const') {
      // ===== const + reactive dep → $derived =====
      // const double = count * 2  →  const double = __derived(() => count * 2)
      // 只在初始化表达式引用了已知的 reactive 变量时才转换
      if (exprReferencesReactive(decl.init, state.aether.stateVars, state.aether.derivedVars, t)) {
        state.aether.derivedVars.set(varName, path as unknown as NodePath<t.VariableDeclarator>);
        decl.init = t.callExpression(
          t.identifier('__derived'),
          [t.arrowFunctionExpression([], decl.init)]
        );
      }
    }
  }
}

/**
 * 检查表达式是否引用了 reactive 变量（stateVars 或 derivedVars）
 */
function exprReferencesReactive(
  node: t.Node,
  stateVars: Map<string, unknown>,
  derivedVars: Map<string, unknown>,
  t: typeof import('@babel/types')
): boolean {
  if (t.isIdentifier(node)) {
    return stateVars.has(node.name) || derivedVars.has(node.name);
  }
  if (t.isBinaryExpression(node) || t.isLogicalExpression(node)) {
    return exprReferencesReactive(node.left, stateVars, derivedVars, t) ||
           exprReferencesReactive(node.right, stateVars, derivedVars, t);
  }
  if (t.isUnaryExpression(node)) {
    return exprReferencesReactive(node.argument, stateVars, derivedVars, t);
  }
  if (t.isConditionalExpression(node)) {
    return exprReferencesReactive(node.test, stateVars, derivedVars, t) ||
           exprReferencesReactive(node.consequent, stateVars, derivedVars, t) ||
           exprReferencesReactive(node.alternate, stateVars, derivedVars, t);
  }
  if (t.isTemplateLiteral(node)) {
    return node.expressions.some(expr =>
      exprReferencesReactive(expr as t.Node, stateVars, derivedVars, t)
    );
  }
  if (t.isCallExpression(node)) {
    return node.arguments.some(arg =>
      exprReferencesReactive(arg as t.Node, stateVars, derivedVars, t)
    );
  }
  if (t.isMemberExpression(node)) {
    return exprReferencesReactive(node.object, stateVars, derivedVars, t);
  }
  if (t.isArrayExpression(node)) {
    return node.elements.some(el =>
      el ? exprReferencesReactive(el as t.Node, stateVars, derivedVars, t) : false
    );
  }
  if (t.isObjectExpression(node)) {
    return node.properties.some(prop =>
      t.isObjectProperty(prop) ? exprReferencesReactive(prop.value as t.Node, stateVars, derivedVars, t) : false
    );
  }
  return false;
}

/**
 * 检查是否在 for/for-in/for-of 语句的 init 部分
 */
function isInForStatement(path: NodePath<t.Node>): boolean {
  const parent = path.parentPath;
  if (!parent) return false;
  if (parent.isForStatement() && path.key === 'init') return true;
  if (parent.isForInStatement() && path.key === 'left') return true;
  if (parent.isForOfStatement() && path.key === 'left') return true;
  return false;
}

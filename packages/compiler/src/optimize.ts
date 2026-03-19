// Aether Compiler - 优化 Passes
// 1. 死代码消除 (Dead Code Elimination)
// 2. 简单派生内联 (Constant Derived Inlining)
// 3. JSX 完整性验证 (JSX Integrity Validation)

import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

interface AetherState {
  stateVars: Map<string, unknown>;
  derivedVars: Map<string, unknown>;
  effectCalls: unknown[];
  macroImported: boolean;
  importPath: unknown;
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
}

interface StateWithAether extends Record<string, unknown> {
  aether: AetherState;
  opts?: { verbose?: boolean; disableOptimizations?: boolean };
  filename?: string;
}

interface PathWithMutations extends NodePath<t.Node> {
  replaceWithMultiple(nodes: t.Node[]): void;
  remove(): void;
  replaceWith(node: t.Node | NodePath<t.Node>): void;
}

export const optimize = {
  // ============================================
  // 死代码消除
  // 移除永远不会执行的代码分支
  // ============================================
  deadCodeElimination(path: PathWithMutations, state: StateWithAether, t: typeof import('@babel/types')): boolean {
    // 处理 if 语句
    if (t.isIfStatement(path.node)) {
      const test = path.node.test;
      const testValue = evaluateStaticExpression(test, state, t);

      if (testValue === true) {
        // if (true) { consequent } → consequent
        if (t.isBlockStatement(path.node.consequent)) {
          path.replaceWithMultiple(path.node.consequent.body);
        } else {
          path.replaceWith(path.node.consequent);
        }
        return true;
      }

      if (testValue === false) {
        // if (false) { consequent } else { alternate } → alternate
        if (path.node.alternate) {
          if (t.isBlockStatement(path.node.alternate)) {
            path.replaceWithMultiple(path.node.alternate.body);
          } else {
            path.replaceWith(path.node.alternate);
          }
        } else {
          path.remove();
        }
        return true;
      }
    }

    // 处理条件表达式
    if (t.isConditionalExpression(path.node)) {
      const testValue = evaluateStaticExpression(path.node.test, state, t);

      if (testValue === true) {
        path.replaceWith(path.node.consequent);
        return true;
      }

      if (testValue === false) {
        path.replaceWith(path.node.alternate || t.identifier('undefined'));
        return true;
      }
    }

    // 处理逻辑与/或的短路求值
    if (t.isLogicalExpression(path.node)) {
      const leftValue = evaluateStaticExpression(path.node.left, state, t);

      if (path.node.operator === '&&') {
        if (leftValue === false || leftValue === null || leftValue === undefined) {
          // false && expr → false
          path.replaceWith(path.node.left);
          return true;
        }
        if (leftValue === true) {
          // true && expr → expr
          path.replaceWith(path.node.right);
          return true;
        }
      }

      if (path.node.operator === '||') {
        if (leftValue === true || leftValue === null || leftValue === undefined) {
          // true || expr → true, null || expr → expr, undefined || expr → expr
          path.replaceWith(path.node.left);
          return true;
        }
        if (leftValue === false) {
          // false || expr → expr
          path.replaceWith(path.node.right);
          return true;
        }
      }
    }

    return false;
  },

  // ============================================
  // 简单派生内联
  // 对于 $derived(() => constant) 这样的常量派生，直接内联值
  // ============================================
  constantDerivedInlining(path: NodePath<t.CallExpression>, state: StateWithAether, t: typeof import('@babel/types')): boolean {
    // 查找 $derived 调用
    if (!t.isCallExpression(path.node)) return false;
    if (!t.isIdentifier(path.node.callee)) return false;
    if (path.node.callee.name !== '__derived') return false;

    const fn = path.node.arguments[0];
    if (!t.isArrowFunctionExpression(fn) && !t.isFunctionExpression(fn)) return false;
    if (!t.isBlockStatement(fn.body)) return false;

    // 提取返回值
    const body = fn.body.body;
    if (body.length !== 1) return false;
    const stmt = body[0];
    if (!t.isReturnStatement(stmt)) return false;
    if (!stmt.argument) return false;

    // 检查返回值是否是常量（不包含任何响应式变量读取）
    const expr = stmt.argument;
    if (isConstantExpression(expr, state, t)) {
      // 将 __derived(() => constant) 替换为常量值
      // 标记为已内联，避免后续处理
      state.aether._inlinedDerived = state.aether._inlinedDerived || new Set();
      const derivedVar = findDerivedVarForPath(path, state);
      if (derivedVar) {
        state.aether._inlinedDerived.add(derivedVar);
      }
      path.replaceWith(t.cloneNode(expr) as t.Node);
      return true;
    }

    return false;
  },

  // ============================================
  // JSX 完整性验证
  // 确保所有 JSX 模式都被正确转换，没有遗漏
  // ============================================
  validateJSXIntegrity(path: NodePath<t.JSXElement | t.JSXFragment>, state: StateWithAether, t: typeof import('@babel/types')): Array<{ type: string; message: string; loc: unknown }> {
    const errors: Array<{ type: string; message: string; loc: unknown }> = [];

    // 检查是否有未转换的 JSX 元素
    if (t.isJSXElement(path.node) || t.isJSXFragment(path.node)) {
      // 如果还在 AST 中，说明没有被转换
      errors.push({
        type: 'UNTRANSFORMED_JSX',
        message: 'JSX element was not transformed',
        loc: path.node.loc,
      });
    }

    // 检查 JSX 属性中的响应式表达式
    if (t.isJSXElement(path.node)) {
      const opening = path.node.openingElement;
      for (const attr of opening.attributes) {
        if (t.isJSXExpressionContainer(attr.value)) {
          const expr = attr.value.expression;
          if (t.isIdentifier(expr) && isReactiveVar(expr.name, state)) {
            // 响应式标识符在 JSX 属性中应该被转换
            // 检查是否被正确处理（转换为 .value 或 __bindAttr）
          }
        }
      }
    }

    return errors;
  },
};

// ============================================
// 辅助函数
// ============================================

// 静态求值表达式
function evaluateStaticExpression(expr: t.Expression, state: StateWithAether, t: typeof import('@babel/types')): unknown {
  // 布尔字面量
  if (t.isBooleanLiteral(expr)) return expr.value;

  // 数字字面量
  if (t.isNumericLiteral(expr)) return expr.value;

  // 字符串字面量
  if (t.isStringLiteral(expr)) return expr.value;

  // null/undefined
  if (t.isNullLiteral(expr)) return null;
  if (t.isIdentifier(expr, { name: 'undefined' })) return undefined;

  // 一元表达式
  if (t.isUnaryExpression(expr)) {
    const arg = evaluateStaticExpression(expr.argument, state, t);
    if (arg === undefined) return undefined;
    switch (expr.operator) {
      case '!': return !arg;
      case '-': return -arg;
      case '+': return +arg;
      case '~': return ~arg;
      case 'typeof': return typeof arg;
    }
  }

  // 二元表达式
  if (t.isBinaryExpression(expr)) {
    const left = evaluateStaticExpression(expr.left, state, t);
    const right = evaluateStaticExpression(expr.right, state, t);
    if (left === undefined || right === undefined) return undefined;

    switch (expr.operator) {
      case '===': return left === right;
      case '!==': return left !== right;
      case '==': return left == right;
      case '!=': return left != right;
      case '<': return left < right;
      case '<=': return left <= right;
      case '>': return left > right;
      case '>=': return left >= right;
      case '+': return left + right;
      case '-': return left - right;
      case '*': return left * right;
      case '/': return left / right;
      case '%': return left % right;
      case '|': return left | right;
      case '&': return left & right;
      case '^': return left ^ right;
      case '<<': return left << right;
      case '>>': return left >>> right;
      case '>>>': return left >>> right;
    }
  }

  // 逻辑表达式
  if (t.isLogicalExpression(expr)) {
    const left = evaluateStaticExpression(expr.left, state, t);

    if (expr.operator === '&&') {
      if (!left) return left;
      return evaluateStaticExpression(expr.right, state, t);
    }

    if (expr.operator === '||') {
      if (left) return left;
      return evaluateStaticExpression(expr.right, state, t);
    }
  }

  // 条件表达式
  if (t.isConditionalExpression(expr)) {
    const test = evaluateStaticExpression(expr.test, state, t);
    if (test === true) return evaluateStaticExpression(expr.consequent, state, t);
    if (test === false) return evaluateStaticExpression(expr.alternate, state, t);
  }

  // 标识符 - 检测是否是常量
  if (t.isIdentifier(expr)) {
    // 检查是否是已知的响应式变量
    if (isReactiveVar(expr.name, state)) return undefined;
    // 非响应式标识符假设为常量
    return expr.name;
  }

  // 模板字面量（无插值）
  if (t.isTemplateLiteral(expr) && expr.expressions.length === 0) {
    return expr.quasis[0].value.cooked;
  }

  return undefined;
}

// 判断是否是常量表达式
function isConstantExpression(expr: t.Expression, state: StateWithAether, t: typeof import('@babel/types')): boolean {
  // 字面量
  if (t.isLiteral(expr)) return true;

  // 只包含常量的模板字面量
  if (t.isTemplateLiteral(expr)) {
    return expr.expressions.every(e => isConstantExpression(e, state, t));
  }

  // 只包含常量的二元/一元表达式
  if (t.isBinaryExpression(expr) || t.isUnaryExpression(expr)) {
    return expr.children.every(child => isConstantExpression(child as t.Expression, state, t));
  }

  // 只包含常量的数组/对象
  if (t.isArrayExpression(expr)) {
    return expr.elements.every(el => el !== false && isConstantExpression(el as t.Expression, state, t));
  }

  if (t.isObjectExpression(expr)) {
    return expr.properties.every(prop => {
      if (t.isSpreadElement(prop)) return false;
      return isConstantExpression((prop as t.ObjectProperty).value, state, t);
    });
  }

  // 标识符 - 如果不是响应式变量则是常量
  if (t.isIdentifier(expr)) {
    return !isReactiveVar(expr.name, state);
  }

  return false;
}

// 检查是否是响应式变量（$state 或 $derived 声明的）
function isReactiveVar(name: string, state: StateWithAether): boolean {
  if (!state || !state.aether) return false;
  return state.aether.stateVars?.has(name) || state.aether.derivedVars?.has(name);
}

// 查找给定 path 对应的派生变量名
function findDerivedVarForPath(path: NodePath<t.CallExpression>, state: StateWithAether): string | null {
  if (!state.aether?.derivedVars) return null;

  for (const [varName, varPath] of state.aether.derivedVars) {
    if (varPath === path) return varName;
    // 检查是否是同一个节点
    if ((varPath as NodePath<t.VariableDeclarator>).node === path.node) return varName;
  }

  return null;
}

// 收集所有优化报告
export function generateOptimizationReport(state: StateWithAether) {
  const report = {
    inlinedDerived: [] as string[],
    eliminatedDeadCode: 0,
    jsxValidationErrors: [] as unknown[],
  };

  if (state.aether?._inlinedDerived) {
    report.inlinedDerived = Array.from(state.aether._inlinedDerived);
  }

  return report;
}

// Aether Compiler - SSR 转换
// 处理服务端渲染的组件检测和代码生成
//
// 功能:
// 1. 检测服务端组件 (ServerComponent 或 $server 宏)
// 2. 代码生成:
//    - 服务端: 生成直接 HTML 输出 (无需响应式绑定)
//    - 客户端: 生成水合代码
// 3. 边界标记: __markServer() / __markClient()

import type { NodePath } from '@babel/traverse';
import type * as t from '@babel/types';

interface SSRState {
  // 组件类型检测
  isServerComponent: boolean;
  isClientComponent: boolean;
  componentName: string | null;

  // 导入追踪
  serverMacroImported: boolean;
  _import_$server?: string;

  // 编译模式
  ssrMode: boolean;  // true = SSR 编译, false = CSR 编译

  // 边界信息
  serverBoundaryMarked: boolean;
  clientBoundaryMarked: boolean;
}

interface StateWithSSR extends Record<string, unknown> {
  ssr: SSRState;
  aether?: {
    stateVars: Map<string, unknown>;
    derivedVars: Map<string, unknown>;
    effectCalls: unknown[];
    macroImported: boolean;
    _needsDOM?: boolean;
    _hasAsync?: boolean;
    _hasStore?: boolean;
  };
  opts?: { ssr?: boolean; verbose?: boolean };
  filename?: string;
}

type VisitorFn = (
  path: NodePath<t.Node>,
  state: StateWithSSR
) => void;

export const transformSSR: Record<string, VisitorFn> = {
  // ============================================
  // 检测服务端组件入口点
  // export default function ServerComponent() {}
  // 或 function ServerComponent() {}
  // ============================================
  FunctionDeclaration(path, state, t) {
    if (!state.ssr.ssrMode) return;

    const name = path.node.id?.name;
    if (!name) return;

    // 检测 ServerComponent 命名约定
    if (isServerComponentName(name)) {
      markServerComponent(path, state, t);
    }

    // 检测 $server 宏标记
    if (hasServerMacro(path, state, t)) {
      markServerComponent(path, state, t);
    }
  },

  // 检测箭头函数组件: const Component = () => {}
  VariableDeclarator(path, state, t) {
    if (!state.ssr.ssrMode) return;

    const id = path.node.id;
    if (!t.isIdentifier(id)) return;

    // 检测命名箭头函数: const ServerComponent = () => {}
    const init = path.node.init;
    if (t.isArrowFunctionExpression(init) && isServerComponentName(id.name)) {
      markServerComponent(path, state, t);
    }
  },

  // ============================================
  // 处理 export default
  // ============================================
  ExportDefaultDeclaration(path, state, t) {
    if (!state.ssr.ssrMode) return;

    const declaration = path.node.declaration;

    // export default function ServerComponent() {}
    if (t.isFunctionDeclaration(declaration)) {
      const name = declaration.id?.name;
      if (name && isServerComponentName(name)) {
        // 创建新的函数声明并替换
        const newFunc = t.functionDeclaration(
          t.identifier(name),
          declaration.params,
          declaration.body
        );
        path.replaceWith(
          t.exportDefaultDeclaration(newFunc)
        );
        markServerComponent(path, state, t);
      }
    }
  },

  // ============================================
  // 处理 JSX 组件转换 (SSR 模式)
  // ============================================
  JSXElement(path, state, t) {
    if (!state.ssr.ssrMode) return;
    if (!state.ssr.isServerComponent) return;

    // SSR 模式: 直接生成 HTML 字符串，不生成 DOM 绑定代码
    const result = buildServerElement(path.node as t.JSXElement, state, t);
    path.replaceWith(result);
  },

  JSXFragment(path, state, t) {
    if (!state.ssr.ssrMode) return;
    if (!state.ssr.isServerComponent) return;

    // SSR 模式: 直接生成 HTML 字符串
    const result = buildServerFragment(path.node as t.JSXFragment, state, t);
    path.replaceWith(result);
  },

  // ============================================
  // 处理 $state/$derived 在 SSR 中的转换
  // SSR 中 $state 保持原样执行 (非响应式)
  // ============================================
  Identifier(path, state, t) {
    if (!state.ssr.ssrMode) return;
    if (!state.ssr.isServerComponent) return;

    const name = path.node.name;

    // 在 SSR 中，stateVars 的 .value 访问应该被移除
    // 因为 SSR 中这些是普通变量，不是信号
    if (state.aether?.stateVars?.has(name)) {
      // 跳过已经处理过的 member expression
      const parent = path.parent;
      if (t.isMemberExpression(parent) &&
          t.isIdentifier(parent.property) &&
          parent.property.name === 'value') {
        // count.value -> count
        path.parentPath?.replaceWith(path.node);
      }
    }

    if (state.aether?.derivedVars?.has(name)) {
      const parent = path.parent;
      if (t.isMemberExpression(parent) &&
          t.isIdentifier(parent.property) &&
          parent.property.name === 'value') {
        // double.value -> double
        path.parentPath?.replaceWith(path.node);
      }
    }
  },

  // ============================================
  // 处理 $async 在 SSR 中的转换
  // SSR 中直接执行并返回数据
  // ============================================
  CallExpression(path, state, t) {
    if (!state.ssr.ssrMode) return;
    if (!state.ssr.isServerComponent) return;

    const callee = path.node.callee;
    if (!t.isIdentifier(callee)) return;

    // __async 在 SSR 中直接执行
    if (callee.name === '__async') {
      // SSR: 将 __async(fn) 转换为同步执行
      // 生成: (await fn()) 或直接 fn() 取决于环境
      transformAsyncCall(path, state, t);
    }
  },
};

// ============================================
// 核心转换函数
// ============================================

/**
 * 标记为服务端组件
 */
function markServerComponent(path: NodePath<t.Node>, state: StateWithSSR, t: typeof import('@babel/types')) {
  state.ssr.isServerComponent = true;
  state.ssr.isClientComponent = false;
  state.ssr.serverBoundaryMarked = true;

  // 插入服务端边界标记: __markServer()
  insertBoundaryMarker(path, '__markServer', t);
}

/**
 * 标记为客户端组件
 */
function markClientComponent(path: NodePath<t.Node>, state: StateWithSSR, t: typeof import('@babel/types')) {
  state.ssr.isClientComponent = true;
  state.ssr.isServerComponent = false;
  state.ssr.clientBoundaryMarked = true;

  // 插入客户端边界标记: __markClient()
  insertBoundaryMarker(path, '__markClient', t);
}

/**
 * 插入边界标记调用
 */
function insertBoundaryMarker(path: NodePath<t.Node>, markerName: string, t: typeof import('@babel/types')) {
  const markerCall = t.expressionStatement(
    t.callExpression(t.identifier(markerName), [])
  );

  // 找到函数体
  const funcPath = path.getFunctionParent();
  if (funcPath && funcPath.node.body) {
    const body = funcPath.node.body;
    if (t.isBlockStatement(body)) {
      // 在函数体开头插入
      body.body.unshift(markerCall);
    }
  }
}

/**
 * 检测是否是服务端组件名称
 */
function isServerComponentName(name: string): boolean {
  // ServerComponent, Server, ...Server 结尾
  return /^Server/.test(name) || /Server$/.test(name);
}

/**
 * 检测是否有 $server 宏标记
 */
function hasServerMacro(path: NodePath<t.Node>, state: StateWithSSR, t: typeof import('@babel/types')): boolean {
  // 查找注释中的 @server 标记
  const comments = path.node.leadingComments;
  if (comments) {
    for (const comment of comments) {
      if (comment.value.includes('@server') || comment.value.includes('$server')) {
        return true;
      }
    }
  }

  // 检查 $server 导入
  if (state.ssr.serverMacroImported) {
    // 检查函数/变量前是否有 $server 调用
    const parent = path.parent;
    if (parent && t.isCallExpression(parent)) {
      if (t.isIdentifier(parent.callee) && parent.callee.name === state.ssr._import_$server) {
        return true;
      }
    }
  }

  return false;
}

/**
 * SSR 模式: 构建服务端元素
 * 生成 HTML 字符串而不是 DOM 操作
 */
function buildServerElement(node: t.JSXElement, state: StateWithSSR, t: typeof import('@babel/types')): t.CallExpression {
  const opening = node.openingElement;
  const tagName = getTagName(opening.name, t);

  // 检查是否是组件
  if (isComponent(tagName)) {
    return buildServerComponent(node, tagName, state, t);
  }

  // 生成 HTML 字符串: `<${tagName}>...</${tagName}>`
  const children = node.children;
  const childHtml = buildServerChildren(children, state, t);

  // 构建 HTML 字符串
  if (children.length === 0) {
    // 自闭合标签: <input /> -> '<input />'
    return t.callExpression(
      t.identifier('__ssr'),
      [t.stringLiteral(`<${tagName} />`)]
    );
  }

  // 带子元素: <div>content</div> -> `<div>${content}</div>`
  return t.callExpression(
    t.identifier('__ssr'),
    [
      t.templateLiteral(
        [
          t.templateElement({ raw: `<${tagName}>`, cooked: `<${tagName}>` }, false),
          t.templateElement({ raw: `</${tagName}>`, cooked: `</${tagName}>` }, true),
        ],
        [childHtml]
      )
    ]
  );
}

/**
 * SSR 模式: 构建服务端片段
 */
function buildServerFragment(node: t.JSXFragment, state: StateWithSSR, t: typeof import('@babel/types')): t.CallExpression {
  const children = node.children;
  const childHtml = buildServerChildren(children, state, t);

  return t.callExpression(
    t.identifier('__ssr'),
    [childHtml]
  );
}

/**
 * 构建服务端子元素
 */
function buildServerChildren(children: t.JSXChild[], state: StateWithSSR, t: typeof import('@babel/types')): t.Expression {
  if (children.length === 0) {
    return t.stringLiteral('');
  }

  if (children.length === 1) {
    return buildServerChild(children[0], state, t);
  }

  // 多个子元素用数组拼接
  const exprs = children.map(child => buildServerChild(child, state, t));

  return t.callExpression(
    t.memberExpression(t.arrayExpression([]), t.identifier('concat')),
    exprs
  );
}

/**
 * 构建单个服务端子节点
 */
function buildServerChild(child: t.JSXChild, state: StateWithSSR, t: typeof import('@babel/types')): t.Expression {
  if (t.isJSXText(child)) {
    const text = child.value.replace(/\s+/g, ' ');
    return t.stringLiteral(text);
  }

  if (t.isJSXExpressionContainer(child)) {
    const expr = child.expression;
    if (t.isJSXEmptyExpression(expr)) {
      return t.stringLiteral('');
    }

    // 动态表达式: ${expr} -> __ssrEscape(String(expr))
    return t.callExpression(
      t.identifier('__ssrEscape'),
      [t.callExpression(t.identifier('String'), [expr])]
    );
  }

  if (t.isJSXElement(child)) {
    return buildServerElement(child, state, t);
  }

  if (t.isJSXFragment(child)) {
    return buildServerFragment(child, state, t);
  }

  return t.stringLiteral('');
}

/**
 * 构建服务端组件调用
 */
function buildServerComponent(node: t.JSXElement, tagName: string, state: StateWithSSR, t: typeof import('@babel/types')): t.CallExpression {
  const opening = node.openingElement;

  // 收集 props
  const properties: t.ObjectProperty[] = [];
  for (const attr of opening.attributes) {
    if (t.isJSXSpreadAttribute(attr)) {
      properties.push(t.spreadElement(attr.argument) as unknown as t.ObjectProperty);
    } else {
      const name = getAttrName(attr.name, t);
      const value = attr.value
        ? (t.isJSXExpressionContainer(attr.value) ? attr.value.expression : attr.value)
        : t.booleanLiteral(true);
      properties.push(t.objectProperty(t.identifier(name), value));
    }
  }

  // 处理 children
  const children = node.children.filter(c => {
    if (t.isJSXText(c) && c.value.trim() === '') return false;
    return true;
  });

  if (children.length > 0) {
    const childExprs: t.Expression[] = children.map(child => {
      if (t.isJSXText(child)) {
        return t.stringLiteral(child.value.replace(/\s+/g, ' ').trim());
      }
      if (t.isJSXExpressionContainer(child)) {
        return child.expression;
      }
      if (t.isJSXElement(child)) {
        return buildServerElement(child, state, t);
      }
      return t.stringLiteral('');
    });

    properties.push(
      t.objectProperty(
        t.identifier('children'),
        childExprs.length === 1 ? childExprs[0] : t.arrayExpression(childExprs)
      )
    );
  }

  const propsArg = properties.length > 0
    ? t.objectExpression(properties)
    : t.objectExpression([]);

  // 调用组件并传入 props
  return t.callExpression(
    t.identifier(tagName),
    [propsArg]
  );
}

/**
 * 转换 $async 调用 (SSR 模式)
 */
function transformAsyncCall(path: NodePath<t.CallExpression>, state: StateWithSSR, t: typeof import('@babel/types')) {
  const args = path.node.arguments;
  if (args.length === 0) return;

  // __async(() => fetchData()) -> fetchData()
  // 在 SSR 中直接执行异步函数
  if (t.isArrowFunctionExpression(args[0]) && args[0].body) {
    const body = args[0].body;

    // 如果是块语句，提取 return 语句
    if (t.isBlockStatement(body)) {
      const returnStmt = body.body.find(stmt => t.isReturnStatement(stmt));
      if (returnStmt && returnStmt.argument) {
        // __async(() => { return fetchData(); }) -> fetchData()
        path.replaceWith(returnStmt.argument);
        return;
      }
    }

    // 直接表达式: __async(() => fetchData()) -> fetchData()
    path.replaceWith(t.callExpression(body, []));
  }
}

// ============================================
// 辅助函数
// ============================================

function getTagName(name: t.JSXIdentifier | t.JSXMemberExpression, t: typeof import('@babel/types')): string {
  if (t.isJSXIdentifier(name)) return name.name;
  if (t.isJSXMemberExpression(name)) {
    return `${getTagName(name.object, t)}.${name.property.name}`;
  }
  return 'div';
}

function getAttrName(name: t.JSXIdentifier | t.JSXNamespacedName, t: typeof import('@babel/types')): string {
  if (t.isJSXIdentifier(name)) return name.name;
  if (t.isJSXNamespacedName(name)) return `${name.namespace.name}:${name.name.name}`;
  return '';
}

function isComponent(tagName: string): boolean {
  return /^[A-Z]/.test(tagName);
}

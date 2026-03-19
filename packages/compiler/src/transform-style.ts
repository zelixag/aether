// Aether Compiler - 样式转换
// 编译时作用域 CSS：自动生成唯一 hash，将样式作用域限定到组件
//
// 输入:
//   const styles = $style`
//     .counter { color: red; }
//     .btn { background: blue; }
//   `
//
// 输出:
//   (() => {
//     const __scopeId = "ae-x7k2m";
//     const __css = ".counter { color: red; } .btn { background: blue; }";
//     if (!document.querySelector(`style[data-aether="${__scopeId}"]`)) {
//       const __style = document.createElement("style");
//       __style.setAttribute("data-aether", __scopeId);
//       __style.textContent = __css;
//       document.head.appendChild(__style);
//     }
//     return { scope: __scopeId };
//   })()
// 注意：CSS 作用域化功能暂未完全实现（JSX 元素未添加 scope 属性）

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

type VisitorFn = (
  path: NodePath<t.Node>,
  state: StateWithAether
) => void;

export const transformStyle: Record<string, VisitorFn> = {
  taggedTemplate(path, state, t) {
    const tag = path.node.tag;
    if (!t.isIdentifier(tag)) return;
    if (tag.name !== state.aether._import_$style) return;

    state.aether._needsDOM = true;

    const quasi = path.node.quasi;
    // 提取模板字符串内容
    const cssText = quasi.quasis.map(q => q.value.raw).join('__EXPR__');

    // 生成 scope hash
    const scopeId = 'ae-' + hashCode(cssText + (state.filename || ''));

    // 记录当前文件的 scopeId，后续 JSX 转换会用到
    if (!state.aether._scopeIds) state.aether._scopeIds = [];
    state.aether._scopeIds.push(scopeId);

    // 给 CSS 选择器添加属性选择器来作用域化
    // 注意：此功能需要 JSX 元素也添加 scope 属性，目前尚未完全实现
    // 暂时返回原始 CSS 以确保样式能正常工作
    const scopedCSS = scopeCSS(cssText, scopeId);

    // 生成 IIFE
    const iife = t.callExpression(
      t.arrowFunctionExpression([], t.blockStatement([
        // const __scopeId = "ae-xxx"
        t.variableDeclaration('const', [
          t.variableDeclarator(t.identifier('__scopeId'), t.stringLiteral(scopeId))
        ]),
        // const __css = "..."
        t.variableDeclaration('const', [
          t.variableDeclarator(t.identifier('__css'), t.stringLiteral(scopedCSS))
        ]),
        // if (!document.querySelector(...)) { ... }
        t.ifStatement(
          t.unaryExpression('!',
            t.callExpression(
              t.memberExpression(t.identifier('document'), t.identifier('querySelector')),
              [t.stringLiteral(`style[data-aether="${scopeId}"]`)]
            )
          ),
          t.blockStatement([
            t.variableDeclaration('const', [
              t.variableDeclarator(
                t.identifier('__style'),
                t.callExpression(
                  t.memberExpression(t.identifier('document'), t.identifier('createElement')),
                  [t.stringLiteral('style')]
                )
              )
            ]),
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(t.identifier('__style'), t.identifier('setAttribute')),
                [t.stringLiteral('data-aether'), t.identifier('__scopeId')]
              )
            ),
            t.expressionStatement(
              t.assignmentExpression('=',
                t.memberExpression(t.identifier('__style'), t.identifier('textContent')),
                t.identifier('__css')
              )
            ),
            t.expressionStatement(
              t.callExpression(
                t.memberExpression(
                  t.memberExpression(t.identifier('document'), t.identifier('head')),
                  t.identifier('appendChild')
                ),
                [t.identifier('__style')]
              )
            )
          ])
        ),
        // return { scope: __scopeId }
        t.returnStatement(
          t.objectExpression([
            t.objectProperty(t.identifier('scope'), t.identifier('__scopeId'))
          ])
        )
      ])),
      []
    );

    path.replaceWith(iife);
  }
};

// ============================================
// 辅助函数
// ============================================

function hashCode(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash.toString(36).slice(0, 5);
}

// 将 CSS 选择器添加属性选择器来作用域化
// .foo { ... } → .foo[ae-xxx] { ... }
// 注意：此功能需要 JSX 元素也添加 scope 属性，目前尚未完全实现
// 暂时返回原始 CSS 以确保样式能正常工作
function scopeCSS(css: string, scopeId: string): string {
  // TODO: 完整实现需要 JSX 转换时向元素添加 data-aether 属性
  // 暂时返回原始 CSS，依赖自然的 CSS 级联
  return css;
}

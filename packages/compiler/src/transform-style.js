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
//     const __css = ".counter[ae-x7k2m] { color: red; } .btn[ae-x7k2m] { background: blue; }";
//     if (!document.querySelector(`style[data-aether="${__scopeId}"]`)) {
//       const __style = document.createElement("style");
//       __style.setAttribute("data-aether", __scopeId);
//       __style.textContent = __css;
//       document.head.appendChild(__style);
//     }
//     return { scope: __scopeId };
//   })()
//   + 所有 JSX 元素自动添加 [ae-x7k2m] 属性

export const transformStyle = {
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

function hashCode(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0x7fffffff;
  }
  return hash.toString(36).slice(0, 5);
}

// 将 CSS 选择器添加属性选择器
// .foo { ... } → .foo[ae-xxx] { ... }
function scopeCSS(css, scopeId) {
  return css.replace(
    /([.#\w][\w-]*)\s*(\{|,)/g,
    (match, selector, after) => {
      // 跳过 @规则 和 关键帧名
      if (selector.startsWith('@')) return match;
      // 跳过属性值
      if (/^\d/.test(selector)) return match;
      return `${selector}[${scopeId}]${after === ',' ? ',' : ' {'}`;
    }
  ).replace(
    // 处理更复杂的选择器
    /([.#][\w-]+)(?=\s*[{,])/g,
    `$1[${scopeId}]`
  );
}

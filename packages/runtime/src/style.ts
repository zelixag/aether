// Aether 内置样式系统 - 编译时 CSS 作用域
// 用法：
//   $style`
//     .counter { color: red; }
//     .button { background: blue; }
//   `
// 编译器会自动为选择器添加唯一的 data-aether-xxx 属性前缀
// 运行时负责注入样式到 <head>

const injectedStyles: Set<string> = new Set();

// 注入作用域 CSS（编译器输出调用这个）
// scopeId: 编译器根据文件路径生成的唯一 hash
// css: 已被编译器添加了作用域选择器的 CSS 字符串
export function __injectStyle(scopeId: string, css: string): void {
  if (injectedStyles.has(scopeId)) return;
  injectedStyles.add(scopeId);

  if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.setAttribute('data-aether', scopeId);
    style.textContent = css;
    document.head.appendChild(style);
  }
}

// 移除作用域 CSS（组件卸载时可选调用）
export function __removeStyle(scopeId: string): void {
  if (!injectedStyles.has(scopeId)) return;
  injectedStyles.delete(scopeId);

  if (typeof document !== 'undefined') {
    const el = document.querySelector(`style[data-aether="${scopeId}"]`);
    if (el) el.remove();
  }
}

// 生成作用域 ID（编译器在编译时调用，不在运行时）
// 这里仅作为 fallback
export function __scopeId(filename: string): string {
  let hash = 0;
  for (let i = 0; i < filename.length; i++) {
    hash = ((hash << 5) - hash) + filename.charCodeAt(i);
    hash |= 0;
  }
  return 'ae' + Math.abs(hash).toString(36);
}

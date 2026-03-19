// Aether SSR Runtime - 服务端渲染核心
// 实现 renderToString, renderToStream, hydrate
//
// SSR 工作原理：
// 1. renderToString/renderToStream 调用组件函数
// 2. 组件函数中调用 __createElement, __setAttr, __bindText 等
// 3. 这些函数在 SSR 模式下返回 HTML 累加器对象
// 4. 累加器对象的 toString() 返回最终的 HTML 字符串
//
// 编译后的组件代码结构：
// () => {
//   const __el = __createElement("div");
//   __setAttr(__el, "class", "foo");
//   const __t = __createText("hello");
//   __el.appendChild(__t);
//   return __el;  // 这里调用 toString() 获取 HTML
// }

import { Signal, __async, __effect, __pushEffect, __popEffect, AsyncResource, __batch, Effect } from './signal.ts';

// Re-export AsyncResource type
export type { AsyncResource } from './signal.ts';

// ============================================
// SSR Context - 每个 SSR 请求的上下文
// ============================================

interface SSRContext {
  isActive: boolean;
  isHydrating: boolean;
  pendingAsync: number;
  resolveAsync: (() => void) | null;
}

let currentSSRContext: SSRContext | null = null;

function enterSSR(ctx: SSRContext): void {
  currentSSRContext = ctx;
}

function exitSSR(): void {
  currentSSRContext = null;
}

function isSSRActive(): boolean {
  return currentSSRContext !== null && currentSSRContext.isActive;
}

// ============================================
// HTML 累加器 - SSR 模式下替代真实 DOM 元素
// ============================================

class SSRElement {
  tag: string;
  attrs: Record<string, unknown> = {};
  children: (SSRElement | string)[] = [];
  isVoid: boolean;

  constructor(tag: string) {
    this.tag = tag;
    this.isVoid = isVoidTag(tag);
  }

  setAttribute(name: string, value: unknown): void {
    this.attrs[name] = value;
  }

  appendChild(child: SSRElement | string): void {
    this.children.push(child);
  }

  toString(): string {
    return this._toHTML();
  }

  private _toHTML(): string {
    // 生成开始标签
    let html = `<${this.tag}`;

    // 添加属性
    const attrKeys = Object.keys(this.attrs);
    for (const rawKey of attrKeys) {
      let attrName = rawKey;
      const value = this.attrs[rawKey];
      if (value === null || value === undefined || value === false) continue;
      if (value === true) {
        html += ` ${escapeAttr(attrName)}`;
        continue;
      }
      if (attrName === 'className') attrName = 'class';
      if (attrName === 'on' || attrName.startsWith('on')) continue; // 忽略事件
      if (typeof value === 'object') {
        // style 对象
        const styleStr = Object.entries(value as Record<string, string>)
          .map(([k, v]) => `${k}:${v}`)
          .join(';');
        if (styleStr) html += ` style="${escapeAttr(styleStr)}"`;
      } else {
        html += ` ${escapeAttr(attrName)}="${escapeAttr(value)}"`;
      }
    }

    if (this.isVoid) {
      html += '>';
      return html;
    }

    html += '>';

    // 添加子节点
    for (const child of this.children) {
      if (typeof child === 'string') {
        html += escapeHtml(child);
      } else {
        html += child._toHTML();
      }
    }

    // 闭合标签
    html += `</${this.tag}>`;
    return html;
  }
}

// 文本节点
class SSRTextNode {
  value: string;

  constructor(value: unknown) {
    this.value = String(value ?? '');
  }

  toString(): string {
    return escapeHtml(this.value);
  }
}

// Fragment (用于多个根节点)
class SSRFragment {
  children: (SSRElement | string | SSRFragment)[] = [];

  appendChild(child: SSRElement | string | SSRFragment): void {
    this.children.push(child);
  }

  toString(): string {
    return this.children.map(c => {
      if (typeof c === 'string') return escapeHtml(c);
      return c.toString();
    }).join('');
  }
}

// ============================================
// SSR DOM 函数 - 替代真实 DOM 操作
// ============================================

// 危险属性名黑名单
const UNSAFE_ATTRS: Set<string> = new Set([
  '__proto__', 'constructor', 'prototype',
  'toString', 'valueOf', 'hasOwnProperty',
  'isPrototypeOf', 'propertyIsEnumerable',
  'toLocaleString'
]);

function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(value: unknown): string {
  if (value === null || value === undefined) return '';
  return String(value).replace(/"/g, '&quot;');
}

// 自闭合标签
const voidTags = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr'
]);

function isVoidTag(tag: string): boolean {
  return voidTags.has(tag);
}

// SSR 版本的 createElement
export function __createElement(tag: string): SSRElement {
  return new SSRElement(tag);
}

// SSR 版本的 createText
export function __createText(value: unknown): SSRTextNode {
  return new SSRTextNode(value);
}

// SSR 版本的 setAttr (静态属性)
export function __setAttr(el: SSRElement | HTMLElement, name: string, value: unknown): void {
  if (UNSAFE_ATTRS.has(name)) return;

  // 如果是 SSR 元素
  if (el instanceof SSRElement) {
    el.setAttribute(name, value);
    return;
  }

  // 真实 DOM 元素 (hydrate 模式)
  if (el instanceof HTMLElement) {
    if (name === 'className' || name === 'class') {
      el.className = String(value ?? '');
    } else if (name.startsWith('on')) {
      // 事件处理器 - hydrate 时需要重新绑定
    } else if (typeof value === 'boolean') {
      if (value) el.setAttribute(name, '');
      else el.removeAttribute(name);
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(el.style, value);
    } else {
      el.setAttribute(name, String(value ?? ''));
    }
  }
}

// SSR 版本的 bindText - 不创建 Effect，直接设置文本
export function __bindText(node: SSRTextNode | Text, getter: () => unknown): void {
  if (node instanceof SSRTextNode) {
    // SSR 模式：直接获取值
    node.value = String(getter() ?? '');
    return;
  }

  // 客户端模式：需要创建 Effect
  __effect(() => {
    node.textContent = String(getter() ?? '');
  });
}

// SSR 版本的 bindAttr - 不创建 Effect
export function __bindAttr(el: SSRElement | HTMLElement, name: string, getter: () => unknown): void {
  if (el instanceof SSRElement) {
    // SSR 模式：直接获取值
    el.setAttribute(name, getter());
    return;
  }

  // 客户端模式：需要创建 Effect
  __effect(() => {
    const value = getter();
    if (name === 'className' || name === 'class') {
      el.className = String(value ?? '');
    } else if (typeof value === 'boolean') {
      if (value) el.setAttribute(name, '');
      else el.removeAttribute(name);
    } else {
      el.setAttribute(name, String(value ?? ''));
    }
  });
}

// SSR 版本的 conditional - 不注册 Effect
export function __conditional(
  anchor: unknown,
  getter: () => boolean,
  trueBranch: (() => unknown) | null,
  falseBranch: (() => unknown) | null
): SSRElement | SSRFragment | null {
  const condition = getter();
  const branch = condition ? trueBranch : (falseBranch || null);
  if (!branch) return null;

  // 直接执行分支，不创建 Effect
  const result = branch();
  return result as SSRElement | SSRFragment | null;
}

// SSR 版本的 list - 不注册 Effect
export function __list<T>(
  anchor: unknown,
  listGetter: () => T[],
  keyFn: ((item: T, index: number) => string | number) | null,
  renderFn: (item: T, index: number, ctx: unknown) => unknown
): SSRFragment {
  const items = listGetter();
  const fragment = new SSRFragment();

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const key = keyFn ? keyFn(item, i) : i;
    const ctx = {};
    const result = renderFn(item, i, ctx);
    if (result) {
      if (result instanceof SSRElement || result instanceof SSRFragment || typeof result === 'string') {
        fragment.appendChild(result as SSRElement | string | SSRFragment);
      }
    }
  }

  return fragment;
}

// SSR 版本的 createComponent
export function __createComponent(setupFn: (ctx: unknown) => unknown): SSRElement | SSRFragment | string {
  const ctx = {};
  let result: unknown;
  try {
    result = setupFn(ctx);
  } catch (err) {
    console.error('[Aether SSR] Component error:', err);
    return new SSRElement('div');
  }

  if (result instanceof SSRElement || result instanceof SSRFragment || typeof result === 'string') {
    return result;
  }

  // 如果返回的是 DOM 元素 (hydrate 模式)
  if (result instanceof HTMLElement) {
    return result;
  }

  return new SSRElement('div');
}

// SSR 版本的 spreadAttrs
export function __spreadAttrs(el: SSRElement | HTMLElement, attrs: Record<string, unknown> | null | undefined): void {
  if (!attrs || typeof attrs !== 'object') return;

  if (el instanceof SSRElement) {
    for (const key of Object.keys(attrs)) {
      if (!UNSAFE_ATTRS.has(key)) {
        el.setAttribute(key, attrs[key]);
      }
    }
    return;
  }

  // 真实 DOM
  if (el instanceof HTMLElement) {
    for (const key of Object.keys(attrs)) {
      if (!UNSAFE_ATTRS.has(key)) {
        el.setAttribute(key, String(attrs[key] ?? ''));
      }
    }
  }
}

// SSR 版本的 effect - SSR 模式下不执行
export function __effect(fn: () => void | (() => void)): { dispose: () => void } {
  if (isSSRActive()) {
    // SSR 模式：不注册 effect
    return { dispose: () => {} };
  }

  // 客户端模式：正常创建 effect
  const effect = new Effect(fn);
  return {
    dispose: () => effect.dispose()
  };
}

// ============================================
// SSR async 处理
// ============================================

interface AsyncResourceState<T> {
  value: T | undefined;
  loading: boolean;
  error: Error | null;
}

export function __async<T>(fetcher: () => Promise<T>): AsyncResource<T> {
  const ctx = currentSSRContext;

  if (!ctx || !ctx.isActive) {
    // 客户端模式，使用原始实现
    return createAsyncResourceClient(fetcher);
  }

  // SSR 模式：跟踪异步资源
  ctx.pendingAsync++;

  const state: AsyncResourceState<T> = {
    value: undefined,
    loading: true,
    error: null
  };

  const resource: AsyncResource<T> = {
    get value() { return state.value; },
    get loading() { return state.loading; },
    get error() { return state.error; },
    refetch: async () => {
      state.loading = true;
      state.error = null;
      try {
        const result = await fetcher();
        state.value = result;
        state.loading = false;
      } catch (e) {
        state.error = e instanceof Error ? e : new Error(String(e));
        state.loading = false;
      }
      ctx.pendingAsync--;
      if (ctx.pendingAsync === 0 && ctx.resolveAsync) {
        ctx.resolveAsync();
      }
    }
  };

  // 立即执行
  resource.refetch();

  return resource;
}

// 客户端异步资源实现
function createAsyncResourceClient<T>(fetcher: () => Promise<T>): AsyncResource<T> {
  const data = new Signal<T | undefined>(undefined);
  const loading = new Signal<boolean>(true);
  const error = new Signal<Error | null>(null);

  return {
    get value() { return data.value; },
    get loading() { return loading.value; },
    get error() { return error.value; },
    refetch: async () => {
      __batch(() => {
        loading._value = true;
        error._value = null;
      });
      try {
        const result = await fetcher();
        __batch(() => {
          data._value = result;
          loading._value = false;
        });
      } catch (e) {
        __batch(() => {
          error._value = e instanceof Error ? e : new Error(String(e));
          loading._value = false;
        });
      }
    }
  };
}

// ============================================
// 核心 API
// ============================================

/**
 * 将组件渲染为 HTML 字符串（服务端）
 *
 * @example
 * import { renderToString } from 'aether/ssr';
 *
 * const html = await renderToString(() => <App />);
 */
export async function renderToString(componentFn: () => unknown): Promise<string> {
  const ctx: SSRContext = {
    isActive: true,
    isHydrating: false,
    pendingAsync: 0,
    resolveAsync: null
  };

  enterSSR(ctx);

  try {
    // 执行组件
    const result = componentFn();

    // 如果返回 Promise，等待它
    if (result instanceof Promise) {
      await result;
    }

    // 等待所有异步资源加载
    if (ctx.pendingAsync > 0) {
      await new Promise<void>((resolve) => {
        ctx.resolveAsync = resolve;
      });
    }

    // 转换为 HTML 字符串
    if (result instanceof SSRElement || result instanceof SSRFragment) {
      return result.toString();
    }

    if (typeof result === 'string') {
      return result;
    }

    // 如果结果是 DOM 元素（某些边界情况）
    if (result instanceof HTMLElement) {
      return result.innerHTML;
    }

    return '';
  } finally {
    exitSSR();
  }
}

/**
 * 将组件渲染为流（服务端）
 *
 * @example
 * import { renderToStream } from 'aether/ssr';
 *
 * const stream = renderToStream(() => <App />);
 * stream.pipe(res);
 */
export function renderToStream(componentFn: () => unknown): ReadableStream {
  const ctx: SSRContext = {
    isActive: true,
    isHydrating: false,
    pendingAsync: 0,
    resolveAsync: null
  };

  return new ReadableStream({
    async start(controller) {
      enterSSR(ctx);

      try {
        // 执行组件
        const result = componentFn();

        // 如果返回 Promise，等待它
        if (result instanceof Promise) {
          await result;
        }

        // 等待所有异步资源加载
        if (ctx.pendingAsync > 0) {
          await new Promise<void>((resolve) => {
            ctx.resolveAsync = resolve;
          });
        }

        // 发送 HTML
        let html = '';
        if (result instanceof SSRElement || result instanceof SSRFragment) {
          html = result.toString();
        } else if (typeof result === 'string') {
          html = result;
        }

        controller.enqueue(new TextEncoder().encode(html));
        controller.close();
      } catch (err) {
        controller.error(err);
      } finally {
        exitSSR();
      }
    }
  });
}

/**
 * 激活服务端渲染的 HTML（客户端）
 *
 * @example
 * import { hydrate } from 'aether/ssr';
 *
 * hydrate(() => <App />, document.getElementById('app'));
 */
export function hydrate(componentFn: () => unknown, container: Element | null): void {
  if (!container) {
    console.warn('[Aether] Hydrate: container element not found');
    return;
  }

  const ctx: SSRContext = {
    isActive: true,
    isHydrating: true,
    pendingAsync: 0,
    resolveAsync: null
  };

  enterSSR(ctx);

  try {
    // 保存服务端 HTML
    const serverHTML = container.innerHTML;

    // 执行组件（会重新渲染）
    const result = componentFn();

    // 如果返回 SSR 元素，获取其 HTML 并设置到容器
    if (result instanceof SSRElement || result instanceof SSRFragment) {
      const html = result.toString();
      // 在 hydration 模式下，我们不替换整个 HTML
      // 而是让客户端的响应式系统接管
    }

    // 设置 hydration 标志并退出 SSR
    exitSSR();

    // 现在挂载到容器，启用完整的响应式
    // 使用动态导入避免循环依赖
    import('./dom.js').then(({ mount }) => {
      mount(componentFn as () => Node | Node[], container);
    });

  } catch (err) {
    console.error('[Aether] Hydration error:', err);
  }
}

// ============================================
// SSR 工具函数
// ============================================

/**
 * 判断当前是否处于 SSR 模式
 */
export function isSSR(): boolean {
  return isSSRActive();
}

/**
 * 判断当前是否处于 Hydration 模式
 */
export function isHydrating(): boolean {
  return currentSSRContext?.isHydrating ?? false;
}

/**
 * 序列化 SSR 数据（用于嵌入到页面）
 */
export function serializeSSRData(data: Record<string, unknown>): string {
  return `<script>window.__AETHER_DATA__=${JSON.stringify(data)}</script>`;
}

/**
 * 反序列化 SSR 数据（客户端 hydration 使用）
 */
export function deserializeSSRData(): Record<string, unknown> {
  if (typeof window !== 'undefined' && (window as Window & { __AETHER_DATA__?: Record<string, unknown> }).__AETHER_DATA__) {
    return (window as Window & { __AETHER_DATA__?: Record<string, unknown> }).__AETHER_DATA__!;
  }
  return {};
}

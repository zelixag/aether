// Aether Framework - TypeScript 类型定义
// 宏在编译时转换，这里定义的类型确保 IDE 正确推导

declare module 'aether' {
  // ============================================
  // 核心宏
  // ============================================

  /**
   * 声明响应式状态
   * 编译时转换为 Signal，读写自动追踪
   *
   * @example
   * let count = $state(0)        // 类型推导为 number
   * let name = $state('aether')  // 类型推导为 string
   * count++                      // 编译为 count.value++
   */
  export function $state<T>(initialValue: T): T;

  /**
   * 声明派生计算值
   * 依赖自动追踪，结果缓存，惰性计算
   *
   * @example
   * let double = $derived(() => count * 2)  // 类型推导为 number
   */
  export function $derived<T>(fn: () => T): T;

  /**
   * 声明副作用
   * 依赖自动追踪，组件卸载自动清理
   * 返回清理函数可选
   *
   * @example
   * $effect(() => {
   *   console.log(count)
   *   return () => cleanup()
   * })
   */
  export function $effect(fn: () => void | (() => void)): void;

  // ============================================
  // 内置功能宏
  // ============================================

  /**
   * 声明全局跨组件状态
   * 每个属性自动变为独立 Signal
   *
   * @example
   * const store = $store({ count: 0, user: null })
   * store.count++        // 细粒度更新
   * store.user = { name: 'aether' }
   */
  export function $store<T extends Record<string, unknown>>(initialState: T): T;

  /**
   * 声明异步数据源
   * 自动管理 loading/error 状态
   *
   * @example
   * const users = $async(() => fetch('/api/users').then(r => r.json()))
   * if (users.loading) return <p>Loading...</p>
   * if (users.error) return <p>Error: {users.error.message}</p>
   * return <ul>{users.value.map(u => <li>{u.name}</li>)}</ul>
   */
  export function $async<T>(fetcher: () => Promise<T>): {
    readonly value: T | undefined;
    readonly loading: boolean;
    readonly error: Error | null;
    refetch: () => Promise<void>;
  };

  /**
   * 声明作用域样式
   * 编译时生成唯一 hash，CSS 自动作用域化
   *
   * @example
   * const styles = $style`
   *   .counter { color: red; font-size: 24px; }
   *   .btn { background: blue; }
   * `
   */
  export function $style(strings: TemplateStringsArray, ...values: unknown[]): {
    scope: string;
  };

  // ============================================
  // 挂载 API
  // ============================================

  /**
   * 将组件挂载到 DOM
   *
   * @example
   * mount(App, '#app')
   */
  export function mount(
    component: (props?: unknown) => Node | Node[],
    container: string | Element
  ): { unmount: () => void };

  // ============================================
  // 路由
  // ============================================

  /**
   * 编程式导航
   */
  export function navigate(to: string, options?: { replace?: boolean }): void;

  /**
   * 声明式导航链接组件
   */
  export function Link(props: {
    to: string;
    replace?: boolean;
    children?: unknown;
  }): HTMLAnchorElement;

  // ============================================
  // 内部类型（高级用法）
  // ============================================

  export class Signal<T> {
    constructor(value: T);
    get value(): T;
    set value(v: T);
    peek(): T;
  }

  export class Derived<T> {
    constructor(fn: () => T);
    get value(): T;
  }

  export class Effect {
    constructor(fn: () => void | (() => void));
    dispose(): void;
  }

  export class ComponentContext {
    addEffect(effect: Effect): void;
    addChild(child: ComponentContext | { dispose?: () => void } | Node): void;
    dispose(): void;
  }

  // ============================================
  // 运行时导出
  // ============================================

  export {
    __effect,
    __derived,
    __signal,
    __flush,
    __batch,
    __pushEffect,
    __popEffect,
    __store,
    __async,
    __pauseScheduling,
    __resumeScheduling,
    __clearHmrCache,
    __createElement,
    __createText,
    __setAttr,
    __bindText,
    __bindAttr,
    __conditional,
    __list,
    __createComponent,
    __spreadAttrs,
    __hmrApply,
    __injectStyle,
    __removeStyle,
    __scopeId,
    __router,
    __routePath,
    __routeParams,
    __routeQuery,
    Button,
    Input,
    Card,
    CardHeader,
    CardBody,
    CardFooter
  };

  export type { AsyncResource } from '../src/signal.js';
}

// ============================================
// JSX 类型定义
// ============================================
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: unknown;
  }

  interface Element extends Node {}
}

// ============================================
// SSR 模块类型
// ============================================
declare module 'aether/ssr' {
  import type { AsyncResource } from '../src/signal.js';

  /**
   * 将组件渲染为 HTML 字符串（服务端）
   *
   * @example
   * import { renderToString } from 'aether/ssr';
   *
   * const html = await renderToString(() => <App />);
   */
  export function renderToString(componentFn: () => unknown): Promise<string>;

  /**
   * 将组件渲染为流（服务端）
   *
   * @example
   * import { renderToStream } from 'aether/ssr';
   *
   * const stream = renderToStream(() => <App />);
   * stream.pipe(res);
   */
  export function renderToStream(componentFn: () => unknown): ReadableStream;

  /**
   * 激活服务端渲染的 HTML（客户端）
   *
   * @example
   * import { hydrate } from 'aether/ssr';
   *
   * hydrate(() => <App />, document.getElementById('app'));
   */
  export function hydrate(componentFn: () => unknown, container: Element | null): void;

  /**
   * 判断当前是否处于 SSR 模式
   */
  export function isSSR(): boolean;

  /**
   * 判断当前是否处于 Hydration 模式
   */
  export function isHydrating(): boolean;

  /**
   * 序列化 SSR 数据（用于嵌入到页面）
   */
  export function serializeSSRData(data: Record<string, unknown>): string;

  /**
   * 反序列化 SSR 数据（客户端 hydration 使用）
   */
  export function deserializeSSRData(): Record<string, unknown>;

  /**
   * 异步资源类型
   */
  export type { AsyncResource };

  // SSR 内部函数（供编译器生成的代码使用）
  export function __createElement(tag: string): unknown;
  export function __createText(value: unknown): unknown;
  export function __setAttr(el: unknown, name: string, value: unknown): void;
  export function __bindText(node: unknown, getter: () => unknown): void;
  export function __bindAttr(el: unknown, name: string, getter: () => unknown): void;
  export function __conditional(
    anchor: unknown,
    getter: () => boolean,
    trueBranch: (() => unknown) | null,
    falseBranch: (() => unknown) | null
  ): unknown;
  export function __list<T>(
    anchor: unknown,
    listGetter: () => T[],
    keyFn: ((item: T, index: number) => string | number) | null,
    renderFn: (item: T, index: number, ctx: unknown) => unknown
  ): unknown;
  export function __createComponent(setupFn: (ctx: unknown) => unknown): unknown;
  export function __spreadAttrs(el: unknown, attrs: Record<string, unknown> | null | undefined): void;
  export function __effect(fn: () => void | (() => void)): { dispose: () => void };
  export function __async<T>(fetcher: () => Promise<T>): AsyncResource<T>;
  export const __isSSR: boolean;
  export function __isHydrating(): boolean;
}

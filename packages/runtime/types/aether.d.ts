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
  export function $store<T extends Record<string, any>>(initialState: T): T;

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
  export function $style(strings: TemplateStringsArray, ...values: any[]): {
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
    component: (props?: any) => Node,
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
    children?: any;
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
}

// ============================================
// JSX 类型定义
// ============================================
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }

  interface Element extends Node {}
}

// Aether Public API
// 这些是用户代码中 import { $state, $derived, $effect } from 'aether' 的导出
// 实际上这些函数在运行时不会被直接调用——编译器会将它们替换为内部函数
// 但我们仍然导出它们，用于：1) TypeScript 类型推导 2) 开发时的错误提示

export function $state(initialValue) {
  if (typeof window !== 'undefined') {
    console.warn(
      '[Aether] $state() was called at runtime. ' +
      'This usually means the Aether compiler plugin is not configured. ' +
      'Make sure aether-compiler is added to your build tool.'
    );
  }
  return initialValue;
}

export function $derived(fn) {
  if (typeof window !== 'undefined') {
    console.warn(
      '[Aether] $derived() was called at runtime. ' +
      'Make sure the Aether compiler plugin is configured.'
    );
  }
  return fn();
}

export function $effect(fn) {
  if (typeof window !== 'undefined') {
    console.warn(
      '[Aether] $effect() was called at runtime. ' +
      'Make sure the Aether compiler plugin is configured.'
    );
  }
  fn();
}

export function $store(initialState) {
  if (typeof window !== 'undefined') {
    console.warn(
      '[Aether] $store() was called at runtime. ' +
      'Make sure the Aether compiler plugin is configured.'
    );
  }
  return initialState;
}

export function $async(fetcher) {
  if (typeof window !== 'undefined') {
    console.warn(
      '[Aether] $async() was called at runtime. ' +
      'Make sure the Aether compiler plugin is configured.'
    );
  }
  return { value: undefined, loading: true, error: null, refetch: fetcher };
}

// 运行时内部 API（编译器输出会用到）
export {
  Signal, __signal, __effect, __derived,
  __flush, __pushEffect, __popEffect, __batch,
  __store, __async
} from './signal.js';

export {
  mount, __createElement, __createText, __setAttr,
  __bindText, __bindAttr, __conditional, __list,
  __createComponent, __spreadAttrs, ComponentContext
} from './dom.js';

// 内置路由
export { navigate, Link, __router, __routePath, __routeParams, __routeQuery } from './router.js';

// 内置样式
export { __injectStyle, __removeStyle, __scopeId } from './style.js';

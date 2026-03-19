// Aether 内部 API
// 编译器输出的代码 import from 'aether/runtime' 会走这里
// 用户代码不应直接使用这些

export {
  Signal, __signal, __effect, __derived, __flush, __batch,
  __pushEffect, __popEffect, __store, __async,
  __pauseScheduling, __resumeScheduling
} from './signal.ts';

export type { AsyncResource } from './signal.ts';

export {
  mount, __createElement, __createText, __setAttr,
  __bindText, __bindAttr, __conditional, __list,
  __createComponent, __spreadAttrs, ComponentContext
} from './dom.ts';

export { navigate, Link, __router, __routePath, __routeParams, __routeQuery } from './router.ts';

export { __injectStyle, __removeStyle, __scopeId } from './style.ts';

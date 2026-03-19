// Aether 内部 API
// 编译器输出的代码 import from 'aether/runtime' 会走这里
// 用户代码不应直接使用这些

export {
  Signal, __signal, __effect, __derived, __flush, __batch,
  __pushEffect, __popEffect
} from './signal.js';

export {
  mount, __createElement, __createText, __setAttr,
  __bindText, __bindAttr, __conditional, __list,
  __createComponent, ComponentContext
} from './dom.js';

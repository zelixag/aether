// Aether DOM Runtime - 细粒度 DOM 操作
// 编译器生成的代码会调用这些函数

import { __effect, Effect } from './signal.ts';

// DEV 模式性能标记
// Use a function to avoid minifier bug that transforms 'undefined' to template literal
const __DEV__: boolean = (() => {
  try { return process?.env?.NODE_ENV !== 'production'; } catch { return false; }
})();

function __mark(label: string): void {
  if (__DEV__ && performance) {
    performance.mark(`aether:${label}`);
  }
}

function __markStart(label: string): void {
  if (__DEV__ && performance) {
    performance.mark(`aether:${label}:start`);
  }
}

function __markEnd(label: string): void {
  if (__DEV__ && performance) {
    performance.mark(`aether:${label}:end`);
    performance.measure(label, `aether:${label}:start`, `aether:${label}:end`);
  }
}

// 当前组件的 effect 列表（用于卸载时清理）
let currentComponent: ComponentContext | null = null;

// ============================================
// 组件上下文
// ============================================

export class ComponentContext {
  _effects: Effect[];
  _children: (ComponentContext | { dispose?: () => void } | Node)[];
  _disposed: boolean;

  constructor() {
    this._effects = [];
    this._children = [];
    this._disposed = false;
  }

  addEffect(effect: Effect): void {
    this._effects.push(effect);
  }

  addChild(child: ComponentContext | { dispose?: () => void } | Node): void {
    this._children.push(child);
  }

  dispose(): void {
    if (this._disposed) return;
    this._disposed = true;
    __markStart(`component:dispose`);

    // 清理所有子组件（递归）
    for (const child of this._children) {
      if (typeof child === 'object' && child !== null) {
        if (child instanceof ComponentContext) {
          child.dispose();
        } else if (typeof child.dispose === 'function') {
          child.dispose();
        } else if (child instanceof Node && 'remove' in child) {
          child.remove();
        }
      }
    }

    // 清理所有 effect
    for (const effect of this._effects) {
      effect.dispose();
    }

    this._effects = [];
    this._children = [];
    __markEnd(`component:dispose`);
  }
}

export function __createComponent(setupFn: (ctx: ComponentContext) => unknown): unknown {
  const parentComponent = currentComponent;
  const ctx = new ComponentContext();
  currentComponent = ctx;

  if (parentComponent) {
    parentComponent.addChild(ctx);
  }

  let result: unknown;
  try {
    result = setupFn(ctx);
  } finally {
    currentComponent = parentComponent; // 正确恢复父组件
  }

  // 如果 setupFn 返回的是清理函数，包装到 ComponentContext 中
  if (typeof result === 'function') {
    const cleanup = result;
    const originalDispose = ctx.dispose.bind(ctx);
    ctx.dispose = () => {
      cleanup();
      originalDispose();
    };
  }

  // 返回实际结果（Node 或 Node[]），以便 appendChild 能正常工作
  // ComponentContext 仍然被父组件作为 child 引用，用于清理
  return result;
}

// ============================================
// DOM 创建辅助函数
// ============================================

export function __createElement(tag: string): HTMLElement {
  return document.createElement(tag);
}

export function __createText(value: unknown): Text {
  return document.createTextNode(String(value ?? ''));
}

// 危险属性名黑名单——防止原型链污染
const UNSAFE_ATTRS: Set<string> = new Set([
  '__proto__', 'constructor', 'prototype',
  'toString', 'valueOf', 'hasOwnProperty',
  'isPrototypeOf', 'propertyIsEnumerable',
  'toLocaleString'
]);

// 安全的属性展开——只遍历自有属性，过滤危险键
export function __spreadAttrs(el: HTMLElement, attrs: Record<string, unknown> | null | undefined): void {
  if (!attrs || typeof attrs !== 'object') return;
  const keys = Object.keys(attrs); // 仅自有可枚举属性
  for (const key of keys) {
    if (UNSAFE_ATTRS.has(key)) continue;
    __setAttr(el, key, attrs[key]);
  }
}

// 设置静态属性
export function __setAttr(el: HTMLElement, name: string, value: unknown): void {
  // 安全检查：拒绝危险属性名
  if (UNSAFE_ATTRS.has(name)) return;

  if (name === 'className' || name === 'class') {
    el.className = String(value ?? '');
  } else if (name.startsWith('on')) {
    const event = name.slice(2).toLowerCase();
    if (typeof value === 'function') {
      el.addEventListener(event, value as EventListener);
    }
  } else if (name === 'style' && typeof value === 'object' && value !== null) {
    // 安全：只复制自有属性
    const styleObj = value as Record<string, string>;
    const keys = Object.keys(styleObj);
    for (const k of keys) {
      if (!UNSAFE_ATTRS.has(k)) {
        (el.style as Record<string, string>)[k] = styleObj[k];
      }
    }
  } else if (typeof value === 'boolean') {
    if (value) el.setAttribute(name, '');
    else el.removeAttribute(name);
  } else {
    el.setAttribute(name, String(value ?? ''));
  }
}

// ============================================
// 通用子节点插入（处理文本和 DOM 节点混合）
// ============================================

// 静态子节点插入：自动判断 Node vs 文本
export function __child(parent: Node, value: unknown): void {
  if (value == null || value === false || value === true) return;
  if (value instanceof Node) {
    parent.appendChild(value);
  } else if (Array.isArray(value)) {
    for (const item of value) {
      __child(parent, item);
    }
  } else {
    parent.appendChild(document.createTextNode(String(value)));
  }
}

// 响应式子节点绑定：值变化时自动替换（支持 Node / 文本 / 数组）
export function __bindChild(parent: Node, getter: () => unknown): { dispose: () => void } {
  const anchor = document.createComment('');
  parent.appendChild(anchor);

  let currentNodes: Node[] = [];

  const effect = __effect(() => {
    const value = getter();

    // 移除旧节点
    for (const node of currentNodes) {
      node.remove();
    }
    currentNodes = [];

    // 插入新内容
    __insertValue(value, parent, anchor, currentNodes);
  });

  if (currentComponent) {
    currentComponent.addEffect(effect);
  }

  return {
    dispose() {
      effect.dispose();
      for (const node of currentNodes) {
        node.remove();
      }
      anchor.remove();
    }
  };
}

function __insertValue(value: unknown, parent: Node, anchor: Comment, nodes: Node[]): void {
  if (value == null || value === false || value === true) return;
  if (value instanceof Node) {
    parent.insertBefore(value, anchor);
    nodes.push(value);
  } else if (Array.isArray(value)) {
    for (const item of value) {
      __insertValue(item, parent, anchor, nodes);
    }
  } else {
    const t = document.createTextNode(String(value));
    parent.insertBefore(t, anchor);
    nodes.push(t);
  }
}

// 创建响应式文本绑定
// 编译器会生成：__bindText(textNode, () => signal.value)
export function __bindText(node: Text, getter: () => unknown): Effect {
  __markStart('bindText');
  const effect = __effect(() => {
    node.textContent = String(getter() ?? '');
  });
  if (currentComponent) {
    currentComponent.addEffect(effect);
  }
  __markEnd('bindText');
  return effect;
}

// 创建响应式属性绑定
// 编译器会生成：__bindAttr(el, 'class', () => signal.value)
export function __bindAttr(el: HTMLElement, name: string, getter: () => unknown): Effect {
  __markStart(`bindAttr:${name}`);
  const effect = __effect(() => {
    const value = getter();
    if (name === 'className' || name === 'class') {
      el.className = String(value ?? '');
    } else if (name === 'style' && typeof value === 'object' && value !== null) {
      Object.assign(el.style, value);
    } else if (typeof value === 'boolean') {
      if (value) el.setAttribute(name, '');
      else el.removeAttribute(name);
    } else {
      el.setAttribute(name, String(value ?? ''));
    }
  });
  if (currentComponent) {
    currentComponent.addEffect(effect);
  }
  __markEnd(`bindAttr:${name}`);
  return effect;
}

// 条件渲染
export function __conditional(
  anchorNode: Comment,
  getter: () => boolean,
  trueBranch: ((ctx: ComponentContext) => Node | Node[]) | null,
  falseBranch: ((ctx: ComponentContext) => Node | Node[]) | null
): { dispose: () => void } {
  let currentNodes: Node[] = [];
  let currentCtx: ComponentContext | null = null;
  let lastCondition: boolean | undefined = undefined;

  const effect = __effect(() => {
    const condition = getter();

    // 如果条件没变，不需要重新渲染
    if (condition === lastCondition) return;
    lastCondition = condition;

    // 清理旧节点
    for (const node of currentNodes) {
      node.remove();
    }
    if (currentCtx) {
      currentCtx.dispose();
      currentCtx = null;
    }

    // 渲染新分支
    const branch = condition ? trueBranch : (falseBranch || null);
    if (branch) {
      const ctx = new ComponentContext();
      currentCtx = ctx;
      const nodes = branch(ctx);
      currentNodes = Array.isArray(nodes) ? nodes : [nodes];
      const parent = anchorNode.parentNode;
      if (parent) {
        for (const node of currentNodes) {
          parent.insertBefore(node, anchorNode);
        }
      }
    } else {
      currentNodes = [];
    }
  });

  if (currentComponent) {
    currentComponent.addEffect(effect);
  }

  // 返回一个清理函数
  return {
    dispose() {
      effect.dispose();
      for (const node of currentNodes) {
        node.remove();
      }
      if (currentCtx) {
        currentCtx.dispose();
      }
    }
  };
}

// 列表渲染
export function __list<T>(
  anchorNode: Comment,
  listGetter: () => T[],
  keyFn: ((item: T, index: number) => string | number) | null,
  renderFn: (item: T, index: number, ctx: ComponentContext) => Node | Node[]
): { dispose: () => void } {
  interface ListItemEntry {
    nodes: Node[];
    ctx: ComponentContext;
  }

  let currentItems: Map<string | number, ListItemEntry> = new Map(); // key -> { nodes, ctx }
  let lastItems: T[] = []; // 上一次的 items 引用，用于检测变化

  const effect = __effect(() => {
    const items = listGetter();

    // 浅比较检测变化（避免不必要的 diff）
    if (items === lastItems) return;
    lastItems = items;

    const newKeys = new Set<string | number>();
    const parent = anchorNode.parentNode;

    // 创建/复用项
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const key = keyFn ? keyFn(item, i) : i;
      newKeys.add(key);

      if (!currentItems.has(key)) {
        const ctx = new ComponentContext();
        const nodes = renderFn(item, i, ctx);
        const nodeArr = Array.isArray(nodes) ? nodes : [nodes];
        currentItems.set(key, { nodes: nodeArr, ctx });
        if (parent) {
          for (const node of nodeArr) {
            parent.insertBefore(node, anchorNode);
          }
        }
      }
    }

    // 移除不再存在的项
    for (const [key, entry] of currentItems) {
      if (!newKeys.has(key)) {
        for (const node of entry.nodes) {
          node.remove();
        }
        entry.ctx.dispose();
        currentItems.delete(key);
      }
    }
  });

  if (currentComponent) {
    currentComponent.addEffect(effect);
  }

  // 返回一个清理函数
  return {
    dispose() {
      effect.dispose();
      for (const [, entry] of currentItems) {
        for (const node of entry.nodes) {
          node.remove();
        }
        entry.ctx.dispose();
      }
      currentItems.clear();
    }
  };
}

// 挂载应用
// HMR 支持：保存组件实例用于热更新
interface HMRInstance {
  context: ComponentContext;
  nodes: Node[];
  componentFn: () => Node | Node[];
  container: Element;
  id: string;
  unmount: () => void;
}

const __hmrInstances: Map<string, HMRInstance> = typeof window !== 'undefined'
  ? (window.__AETHER_HMR__?.instances as Map<string, HMRInstance> || (window.__AETHER_HMR__ = (window.__AETHER_HMR__ || { instances: new Map() }) as typeof window.__AETHER_HMR__).instances as Map<string, HMRInstance>)
  : new Map();

export function mount(componentFn: () => Node | Node[], container: string | Element, id: string = 'default'): HMRInstance {
  if (typeof container === 'string') {
    container = document.querySelector(container) as Element;
  }
  __markStart('mount');

  // 尝试获取已存在的实例进行 HMR
  const existingInstance = __hmrInstances.get(id);
  let ctx: ComponentContext;
  let nodes: Node | Node[];

  if (existingInstance) {
    // HMR: 复用现有 DOM，先清理旧 effects
    existingInstance.context.dispose();
    ctx = new ComponentContext();
    currentComponent = ctx;
    try {
      nodes = componentFn();
    } catch (err) {
      // HMR 错误边界
      console.error('[Aether HMR] Error re-rendering:', err);
      showHmrErrorOverlay(err as Error);
      currentComponent = null;
      __markEnd('mount');
      return existingInstance;
    }
  } else {
    // 首次挂载
    if (container) {
      container.innerHTML = '';
    }
    ctx = new ComponentContext();
    currentComponent = ctx;
    try {
      nodes = componentFn();
    } catch (err) {
      console.error('[Aether] Mount error:', err);
      showErrorOverlay(err as Error);
      currentComponent = null;
      __markEnd('mount');
      return { unmount: () => {} } as HMRInstance;
    }
  }

  const nodeArr = Array.isArray(nodes) ? nodes : [nodes];

  // 如果是 HMR 复用，只更新变化的部分
  if (existingInstance) {
    // 简单策略：替换整个容器内容
    updateDom(existingInstance.nodes, nodeArr);
  } else {
    if (container) {
      for (const node of nodeArr) {
        container.appendChild(node);
      }
    }
  }

  currentComponent = null;
  __markEnd('mount');

  const instance: HMRInstance = {
    context: ctx,
    nodes: nodeArr,
    componentFn,
    container,
    id,
    unmount() {
      __markStart('unmount');
      ctx.dispose();
      if (container) {
        container.innerHTML = '';
      }
      __hmrInstances.delete(id);
      __markEnd('unmount');
    }
  };

  __hmrInstances.set(id, instance);
  return instance;
}

// DOM 更新（用于 HMR）
function updateDom(oldNodes: Node[], newNodes: Node[]): void {
  const parent = oldNodes[0]?.parentNode;
  if (!parent) return;

  // 简单策略：替换整个容器内容
  for (const node of oldNodes) {
    if ('remove' in node && typeof node.remove === 'function') {
      node.remove();
    }
  }
  for (const node of newNodes) {
    parent.appendChild(node);
  }
}

// 错误 overlay
function showErrorOverlay(err: Error): void {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    background: #dc3545; color: #fff; padding: 1rem;
    font-family: monospace; font-size: 14px;
  `;
  overlay.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 0.5rem;">[Aether Error]</div>
    <div>${err.message || err}</div>
    ${err.stack ? `<pre style="font-size: 11px; overflow: auto; max-height: 200px;">${err.stack}</pre>` : ''}
  `;
  document.body.appendChild(overlay);
}

function showHmrErrorOverlay(err: Error): void {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; z-index: 99999;
    background: #fd7e14; color: #fff; padding: 1rem;
    font-family: monospace; font-size: 14px;
  `;
  overlay.innerHTML = `
    <div style="font-weight: bold; margin-bottom: 0.5rem;">[Aether HMR Error]</div>
    <div>Hot update failed: ${err.message || err}</div>
    <div style="margin-top: 0.5rem; font-size: 12px;">Preserving previous state...</div>
  `;
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 5000);
}

// 重新加载并应用更新
export function __hmrApply(id: string, componentFn: () => Node | Node[]): boolean {
  const instance = __hmrInstances.get(id);
  if (!instance) return false;

  try {
    // 清理旧 effects
    instance.context.dispose();

    // 重新渲染
    const ctx = new ComponentContext();
    currentComponent = ctx;
    const nodes = componentFn();
    const nodeArr = Array.isArray(nodes) ? nodes : [nodes];

    // 更新 DOM
    updateDom(instance.nodes, nodeArr);

    // 更新实例
    instance.context = ctx;
    instance.nodes = nodeArr;

    currentComponent = null;
    return true;
  } catch (err) {
    console.error('[Aether HMR] Apply error:', err);
    showHmrErrorOverlay(err as Error);
    currentComponent = null;
    return false;
  }
}

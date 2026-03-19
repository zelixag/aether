// Aether DOM Runtime - 细粒度 DOM 操作
// 编译器生成的代码会调用这些函数

import { __effect, Effect } from './signal.js';

// 当前组件的 effect 列表（用于卸载时清理）
let currentComponent = null;

// ============================================
// 组件上下文
// ============================================

export class ComponentContext {
  constructor() {
    this._effects = [];
    this._children = [];
  }

  addEffect(effect) {
    this._effects.push(effect);
  }

  addChild(child) {
    this._children.push(child);
  }

  dispose() {
    for (const effect of this._effects) {
      effect.dispose();
    }
    for (const child of this._children) {
      child.dispose();
    }
    this._effects = [];
    this._children = [];
  }
}

export function __createComponent(setupFn) {
  const parentComponent = currentComponent;
  const ctx = new ComponentContext();
  currentComponent = ctx;

  if (parentComponent) {
    parentComponent.addChild(ctx);
  }

  try {
    return setupFn(ctx);
  } finally {
    currentComponent = ctx;
  }
}

// ============================================
// DOM 创建辅助函数
// ============================================

export function __createElement(tag) {
  return document.createElement(tag);
}

export function __createText(value) {
  return document.createTextNode(value);
}

// 设置静态属性
export function __setAttr(el, name, value) {
  if (name === 'className' || name === 'class') {
    el.className = value;
  } else if (name.startsWith('on')) {
    const event = name.slice(2).toLowerCase();
    el.addEventListener(event, value);
  } else if (name === 'style' && typeof value === 'object') {
    Object.assign(el.style, value);
  } else {
    el.setAttribute(name, value);
  }
}

// 创建响应式文本绑定
// 编译器会生成：__bindText(textNode, () => signal.value)
export function __bindText(node, getter) {
  const effect = __effect(() => {
    node.textContent = getter();
  });
  if (currentComponent) {
    currentComponent.addEffect(effect);
  }
  return effect;
}

// 创建响应式属性绑定
// 编译器会生成：__bindAttr(el, 'class', () => signal.value)
export function __bindAttr(el, name, getter) {
  const effect = __effect(() => {
    const value = getter();
    if (name === 'className' || name === 'class') {
      el.className = value;
    } else if (name === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (typeof value === 'boolean') {
      if (value) el.setAttribute(name, '');
      else el.removeAttribute(name);
    } else {
      el.setAttribute(name, value);
    }
  });
  if (currentComponent) {
    currentComponent.addEffect(effect);
  }
  return effect;
}

// 条件渲染
export function __conditional(anchorNode, getter, trueBranch, falseBranch) {
  let currentNodes = [];
  let currentCtx = null;

  const effect = __effect(() => {
    const condition = getter();

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
      for (const node of currentNodes) {
        parent.insertBefore(node, anchorNode);
      }
    } else {
      currentNodes = [];
    }
  });

  if (currentComponent) {
    currentComponent.addEffect(effect);
  }
  return effect;
}

// 列表渲染
export function __list(anchorNode, listGetter, keyFn, renderFn) {
  let currentItems = new Map(); // key -> { nodes, ctx }

  const effect = __effect(() => {
    const items = listGetter();
    const newKeys = new Set();
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
        for (const node of nodeArr) {
          parent.insertBefore(node, anchorNode);
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
  return effect;
}

// 挂载应用
export function mount(componentFn, container) {
  if (typeof container === 'string') {
    container = document.querySelector(container);
  }
  container.innerHTML = '';

  const ctx = new ComponentContext();
  currentComponent = ctx;
  const nodes = componentFn();
  const nodeArr = Array.isArray(nodes) ? nodes : [nodes];
  for (const node of nodeArr) {
    container.appendChild(node);
  }
  currentComponent = null;

  return {
    unmount() {
      ctx.dispose();
      container.innerHTML = '';
    }
  };
}

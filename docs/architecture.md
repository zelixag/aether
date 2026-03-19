# Aether 架构设计文档

## 1. 概述

Aether 是一个编译时响应式框架，专注于将响应式原语的创建和依赖追踪尽可能多地移到编译时，同时保持运行时的高效执行。

**核心理念**：
- 用户编写简洁的声明式代码（无 `.value`、无 hooks 规则）
- 编译器在编译时完成响应式变换
- 运行时专注于高效的响应式执行

## 2. 架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                        用户代码                              │
│   let count = $state(0)                                    │
│   $effect(() => console.log(count))                        │
│   <div>{count}</div>                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ 编译时变换
┌─────────────────────────────────────────────────────────────┐
│                      编译器 (Babel Plugin)                   │
│   - transform-macros.js: $state → __signal 变换             │
│   - transform-jsx.js: JSX → DOM 操作变换                     │
│   - transform-style.js: $style → CSS 作用域变换              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ 编译后代码
┌─────────────────────────────────────────────────────────────┐
│                      运行时 (Runtime)                        │
│   - signal.js: Signal/Effect/Derived 核心                   │
│   - dom.js: DOM 操作                                        │
│   - router.js: 路由                                         │
│   - style.js: 样式注入                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼ 执行
┌─────────────────────────────────────────────────────────────┐
│                      浏览器环境                              │
└─────────────────────────────────────────────────────────────┘
```

## 3. 编译时 vs 运行时决策

### 3.1 编译时处理（编译器）

| 功能 | 编译时处理 | 理由 |
|------|-----------|------|
| `$state(initial)` → `__signal(initial)` | 必须 | 用户不应感知 Signal 对象 |
| `$derived(fn)` → `__derived(fn)` | 必须 | 同上 |
| `$effect(fn)` → `__effect(fn)` | 必须 | 同上 |
| `count` → `count.value` | 必须 | 隐式响应式，避免 Proxy 性能开销 |
| `count = 5` → `count.value = 5` | 必须 | 响应式赋值 |
| `count++` → `count.value++` | 必须 | 响应式更新 |
| JSX → DOM 操作 | 必须 | 细粒度绑定需要编译时信息 |
| CSS 选择器作用域化 | 必须 | 需要文件路径生成 hash |

### 3.2 运行时处理

| 功能 | 运行时处理 | 理由 |
|------|-----------|------|
| Signal 依赖追踪 | 必须 | 动态依赖需要运行时追踪 |
| Effect 执行和调度 | 必须 | 副作用执行时机由运行时决定 |
| Derived 懒计算 | 必须 | 值只有在读取时才计算 |
| DOM 操作 | 必须 | 平台相关，运行时执行 |
| 批量更新调度 | 必须 | 微任务批处理是运行时机制 |
| 路由状态 | 必须 | 依赖浏览器 API |

## 4. 响应式核心设计

### 4.1 Signal

```typescript
class Signal<T> {
  _value: T;
  _subscribers: Set<Effect | Derived>;

  get value(): T {
    if (activeEffect) {
      this._subscribers.add(activeEffect);
      activeEffect._dependencies.add(this);
    }
    return this._value;
  }

  set value(newValue: T) {
    if (Object.is(this._value, newValue)) return;
    this._value = newValue;
    for (const sub of this._subscribers) {
      __scheduleUpdate(sub);
    }
  }
}
```

**设计决策**：
- 使用显式 `.value` 属性（编译器确保正确的 `.value` 插入）
- 相同值不触发更新（`Object.is` 比较）
- 批量通知通过 `__scheduleUpdate` 收集到微任务队列

### 4.2 Effect

```typescript
class Effect {
  _fn: () => void | (() => void);
  _dependencies: Set<Signal | Derived>;
  _cleanup: (() => void) | null;
  _active: boolean;

  run(): void {
    if (!this._active) return;
    this._cleanupDeps();
    if (this._cleanup) this._cleanup();
    __pushEffect(this);
    try {
      const result = this._fn();
      if (typeof result === 'function') {
        this._cleanup = result;
      }
    } finally {
      __popEffect();
    }
  }

  dispose(): void {
    this._active = false;
    this._cleanupDeps();
    if (this._cleanup) {
      this._cleanup();
      this._cleanup = null;
    }
  }
}
```

**设计决策**：
- 自动依赖追踪（通过 `__pushEffect/__popEffect` 建立 `activeEffect` 栈）
- 支持清理函数（Effect 返回函数作为清理逻辑）
- `dispose()` 方法支持手动清理和组件卸载

### 4.3 Derived

```typescript
class Derived<T> {
  _fn: () => T;
  _signal: Signal<T>;
  _dependencies: Set<Signal | Derived>;
  _dirty: boolean;

  get value(): T {
    if (this._dirty) {
      this._compute();
    }
    if (activeEffect) {
      this._signal._subscribers.add(activeEffect);
      activeEffect._dependencies.add(this._signal);
    }
    return this._signal._value;
  }

  run(): void {
    if (this._dirty) return;
    this._dirty = true;
    // 延迟通知下游（实际计算在 .value 访问时）
    for (const sub of this._signal._subscribers) {
      __scheduleUpdate(sub);
    }
  }
}
```

**设计决策**：
- 懒计算：值只在读取时重新计算
- 脏标记：`run()` 标记 dirty，`value` 访问时触发 `_compute()`
- 下游传播：上游变化时标记自身 dirty，通知下游重新执行

### 4.4 调度器

```typescript
let pendingUpdates: Set<Effect | Derived> = new Set();
let updateScheduled = false;
let batchDepth = 0;

function __scheduleUpdate(effect: Effect | Derived): void {
  pendingUpdates.add(effect);
  if (!updateScheduled) {
    updateScheduled = true;
    if (batchDepth === 0) {
      queueMicrotask(__flushUpdates);
    }
  }
}

function __flushUpdates(): void {
  if (batchDepth > 0) return;
  const sorted = topologicalSort(pendingUpdates);
  pendingUpdates = new Set();
  updateScheduled = false;
  for (const effect of sorted) {
    if (effect._active) {
      effect.run();
    }
  }
}
```

**设计决策**：
- 微任务批处理：所有更新在微任务中统一执行，避免重复渲染
- 拓扑排序：按依赖层级排序，确保叶子节点先更新
- 批量模式（`__batch`）：支持嵌套批量，暂停调度直到批处理完成

## 5. Store 设计

```typescript
function __store<T extends Record<string, unknown>>(initialState: T): T {
  const signals: Record<string, Signal<unknown>> = {};

  const proxy = new Proxy<T>({} as T, {
    get(_, key): unknown {
      if (key === '__signals') return signals;
      if (!signals[key]) return undefined;
      // 建立订阅关系
      if (activeEffect) {
        signals[key]._subscribers.add(activeEffect);
        activeEffect._dependencies.add(signals[key]);
      }
      return signals[key]._value;
    },
    set(_, key, value): boolean {
      if (!signals[key]) {
        signals[key] = new Signal<unknown>(value);
      } else {
        signals[key]._value = value;
        // 通知所有订阅者
        for (const sub of signals[key]._subscribers) {
          __scheduleUpdate(sub);
        }
      }
      return true;
    },
    // ...
  });

  // 初始化所有属性为信号
  for (const [key, value] of Object.entries(initialState)) {
    signals[key] = new Signal<unknown>(value);
  }

  return proxy;
}
```

**设计决策**：
- 每个属性独立的 Signal：支持细粒度更新
- Proxy 拦截读写：透明的响应式对象
- 直接读写 `_value` 避免循环通知

## 6. Async 设计

```typescript
function __async<T>(fetcher: () => Promise<T>): AsyncResource<T> {
  const data = new Signal<T | undefined>(undefined);
  const loading = new Signal<boolean>(true);
  const error = new Signal<Error | null>(null);

  async function refetch(): Promise<void> {
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

  refetch();
  return { get value() { return data.value; }, ... };
}
```

**设计决策**：
- 三个独立信号：`data`、`loading`、`error`
- `__batch` 批处理：确保 effect 只看到最终状态
- 立即执行 `refetch()`：初始化时自动加载

## 7. JSX 转换

### 7.1 元素转换

```jsx
// 输入
<div class={cls}>{count} items</div>

// 输出
(() => {
  const __el = __createElement("div");
  __bindAttr(__el, "class", () => cls.value);
  const __t = __createText("");
  __bindText(__t, () => count.value);
  __el.appendChild(__t);
  __el.appendChild(__createText(" items"));
  return __el;
})()
```

### 7.2 响应式绑定

| 类型 | 编译器输出 | 运行时 |
|------|-----------|--------|
| 静态属性 `class="foo"` | `__setAttr(el, "class", "foo")` | 一次性设置 |
| 动态属性 `class={cls}` | `__bindAttr(el, "class", () => cls.value)` | Effect 绑定 |
| 静态文本 `{count}` | `__createText("" + count.value)` | 一次性设置 |
| 动态文本 `{count}` | `__bindText(text, () => count.value)` | Effect 绑定 |

**设计决策**：
- 静态/动态分离：静态部分减少 Effect 数量
- 闭包捕获信号值：`() => signal.value` 确保正确的依赖追踪
- IIFE 包装：避免污染作用域

## 8. CSS 作用域

```jsx
// 输入
const s = $style`
  .button { color: red; }
`;

// 输出
(() => {
  const __scopeId = "ae-x7k2m";
  const __css = ".button[ae-x7k2m] { color: red; }";
  if (!document.querySelector(`style[data-aether="${__scopeId}"]`)) {
    const __style = document.createElement("style");
    __style.setAttribute("data-aether", __scopeId);
    __style.textContent = __css;
    document.head.appendChild(__style);
  }
  return { scope: __scopeId };
})()
```

**设计决策**：
- 编译时生成 hash：基于 CSS 内容和文件路径
- 属性选择器作用域：`.button[ae-x7k2m]` 而非类名混淆
- 惰性注入：只在首次使用时注入

## 9. API 设计

### 9.1 核心 API

| API | 用法 | 编译后 |
|-----|------|--------|
| `$state(initial)` | `let count = $state(0)` | `const count = __signal(0)` |
| `$derived(fn)` | `let doubled = $derived(() => count * 2)` | `const doubled = __derived(() => count.value * 2)` |
| `$effect(fn)` | `$effect(() => { console.log(count) })` | `__effect(() => { console.log(count.value) })` |
| `$store(initial)` | `const store = $store({ count: 0 })` | `const store = __store({ count: 0 })` |
| `$async(fetcher)` | `const data = $async(() => fetch('/api'))` | `const data = __async(() => fetch('/api'))` |
| `$style` | `` const s = $style`.button {}` `` | CSS 注入代码 |

### 9.2 DOM API

| API | 用法 |
|-----|------|
| `mount(component, container)` | 挂载组件到容器 |
| `__createElement(tag)` | 创建 DOM 元素 |
| `__createText(text)` | 创建文本节点 |
| `__setAttr(el, name, value)` | 设置静态属性 |
| `__bindAttr(el, name, getter)` | 绑定响应式属性 |
| `__bindText(node, getter)` | 绑定响应式文本 |
| `__conditional(anchor, getter, trueFn, falseFn)` | 条件渲染 |
| `__list(anchor, itemsGetter, keyFn, renderFn)` | 列表渲染 |

### 9.3 路由 API

| API | 用法 |
|-----|------|
| `navigate(to, options?)` | 编程式导航 |
| `Link(props)` | 声明式链接 |
| `__router(routes)` | 路由容器 |

## 10. 已知问题与限制

### 10.1 限制

1. **命名冲突**：如果用户代码中有与 `__` 开头的变量，可能与编译器输出冲突
2. **嵌套对象响应式**：`$store({ nested: { a: 1 } })` 的 `store.nested.a = 2` 不会触发更新
3. **异步副作用追踪**：`$effect` 内 `await` 后的代码不会自动追踪依赖

### 10.2 待改进

1. **更完善的测试**：需要更多边界情况的测试覆盖
2. **TypeScript 优化**：考虑使用 `infer` 提供更好的类型推导
3. **SSR 支持**：运行时目前仅支持浏览器环境
4. **DevTools**：缺少开发调试工具

## 11. 未来方向

### 11.1 可能的改进

1. **细粒度 Store 更新**：支持嵌套对象的响应式追踪
2. **SSR 预渲染**：支持服务器端渲染
3. **异步 Effect**：更好地支持 `await` 语义
4. **Computed 缓存策略**：可配置的缓存失效策略
5. **批量更新优化**：支持 `requestAnimationFrame` 批处理

### 11.2 不计划做的事

1. **不引入 Hooks 规则**：Aether 的目标是避免 Hooks 的心智负担
2. **不强制 TypeScript**：运行时是 JavaScript，但支持 TypeScript
3. **不内置状态管理**：Store 已提供跨组件共享状态的能力

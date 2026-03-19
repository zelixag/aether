// Aether Signal Runtime - 极简响应式核心
// 目标：< 3KB minified

// ============================================
// DEV 模式性能标记
// ============================================
const __DEV__: boolean = typeof process !== 'undefined' && process.env.NODE_ENV !== 'production';

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

function __mark(label: string): void {
  if (__DEV__ && performance) {
    performance.mark(`aether:${label}`);
  }
}

// ============================================
// 依赖追踪
// ============================================

// 当前正在执行的 effect/derived，用于自动收集依赖
let activeEffect: Effect | Derived | null = null;
const effectStack: (Effect | Derived | null)[] = [];

export function __pushEffect(effect: Effect | Derived | null): void {
  effectStack.push(activeEffect);
  activeEffect = effect;
}

export function __popEffect(): void {
  activeEffect = effectStack.pop() ?? null;
}

// ============================================
// Signal - 响应式状态
// ============================================

export class Signal<T> {
  _value: T;
  _subscribers: Set<Effect | Derived>;

  constructor(value: T) {
    this._value = value;
    this._subscribers = new Set();
  }

  get value(): T {
    // 读取时，如果有活跃的 effect，自动订阅
    if (activeEffect) {
      this._subscribers.add(activeEffect);
      activeEffect._dependencies.add(this);
    }
    return this._value;
  }

  set value(newValue: T) {
    if (Object.is(this._value, newValue)) return;
    this._value = newValue;
    // 批量通知：收集到队列中，微任务统一执行
    for (const sub of this._subscribers) {
      __scheduleUpdate(sub);
    }
  }

  peek(): T {
    return this._value;
  }

  // 移除订阅者
  _unsubscribe(effect: Effect | Derived): void {
    this._subscribers.delete(effect);
  }
}

// 创建信号的工厂函数（编译器输出使用这个）
// HMR 支持：优先从缓存恢复状态
const __hmrSignalCache: Map<string, unknown> = typeof window !== 'undefined' ? (window.__AETHER_HMR__?.componentStates || new Map()) : new Map();
let __hmrSignalKey = 0;

export function __signal<T>(initialValue: T): Signal<T> {
  // HMR: 尝试恢复缓存的状态
  const cacheKey = `s_${__hmrSignalKey++}`;
  const cached = __hmrSignalCache.get(cacheKey);
  if (cached !== undefined) {
    return new Signal<T>(cached as T);
  }
  return new Signal<T>(initialValue);
}

// 清除 HMR 缓存
export function __clearHmrCache(): void {
  __hmrSignalCache.clear();
  __hmrSignalKey = 0;
}

// ============================================
// Effect - 副作用
// ============================================

export class Effect {
  _fn: () => void | (() => void);
  _dependencies: Set<Signal<unknown> | Derived>;
  _cleanup: (() => void) | null;
  _active: boolean;
  _id: number;

  constructor(fn: () => void | (() => void)) {
    this._fn = fn;
    this._dependencies = new Set();
    this._cleanup = null;
    this._active = true;
    this._id = Effect._nextId++;
    // 立即执行一次，建立依赖
    this.run();
  }

  run(): void {
    if (!this._active) return;
    __markStart(`effect:${this._id}`);
    // 清理旧依赖
    this._cleanupDeps();
    // 执行清理函数
    if (this._cleanup && typeof this._cleanup === 'function') {
      this._cleanup();
    }
    // 重新收集依赖
    __pushEffect(this);
    try {
      const result = this._fn();
      // effect 函数可以返回清理函数
      if (typeof result === 'function') {
        this._cleanup = result;
      }
    } finally {
      __popEffect();
      __markEnd(`effect:${this._id}`);
    }
  }

  _cleanupDeps(): void {
    for (const dep of this._dependencies) {
      dep._unsubscribe(this);
    }
    this._dependencies.clear();
  }

  dispose(): void {
    if (!this._active) return;
    __markStart(`dispose:${this._id}`);
    this._active = false;
    this._cleanupDeps();
    if (this._cleanup && typeof this._cleanup === 'function') {
      this._cleanup();
      this._cleanup = null;
    }
    __markEnd(`dispose:${this._id}`);
  }

  static _nextId: number = 0;
}

export function __effect(fn: () => void | (() => void)): Effect {
  return new Effect(fn);
}

// ============================================
// Derived - 派生计算（带缓存）
// ============================================

export class Derived<T> {
  _fn: () => T;
  _signal: Signal<T>;
  _dependencies: Set<Signal<unknown> | Derived>;
  _dirty: boolean;
  _id: number;

  constructor(fn: () => T) {
    this._fn = fn;
    this._signal = new Signal<T>(undefined as T);
    this._dependencies = new Set();
    this._dirty = true;
    this._id = Derived._nextId++;
    // 初次计算
    this._compute();
  }

  _compute(): void {
    __markStart(`derived:${this._id}`);
    this._cleanupDeps();
    __pushEffect(this);
    try {
      this._signal._value = this._fn();
      this._dirty = false;
    } finally {
      __popEffect();
      __markEnd(`derived:${this._id}`);
    }
  }

  // Derived 被通知更新时，标记为 dirty 并传播通知
  run(): void {
    if (this._dirty) return; // 已经 dirty，无需重复通知
    this._dirty = true;
    // 不立即重新计算——延迟到下次 .value 读取时
    // 但需要通知下游订阅者（它们也需要标记为 dirty 或重新执行）
    for (const sub of this._signal._subscribers) {
      __scheduleUpdate(sub);
    }
  }

  get value(): T {
    if (this._dirty) {
      this._compute();
    }
    // 代理到内部信号的读取（自动订阅）
    if (activeEffect) {
      this._signal._subscribers.add(activeEffect);
      activeEffect._dependencies.add(this._signal);
    }
    return this._signal._value;
  }

  _cleanupDeps(): void {
    for (const dep of this._dependencies) {
      dep._unsubscribe(this);
    }
    this._dependencies.clear();
  }

  dispose(): void {
    this._cleanupDeps();
    this._dependencies.clear();
    this._dirty = true;
  }

  static _nextId: number = 0;
}

export function __derived<T>(fn: () => T): Derived<T> {
  return new Derived<T>(fn);
}

// ============================================
// 批量更新调度器（优化版）
// ============================================

let pendingUpdates: Set<Effect | Derived> = new Set();
let updateScheduled = false;
let batchDepth = 0; // 嵌套批量深度
let batchFn: (() => void) | null = null; // 当前批量回调

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
  if (batchDepth > 0) return; // 还在 batch 中，跳过

  __markStart('flush');
  const updates = pendingUpdates;
  pendingUpdates = new Set();
  updateScheduled = false;

  // 按依赖层级排序（先更新叶子节点）
  const sorted = topologicalSort(updates);
  for (const effect of sorted) {
    if (effect._active) {
      effect.run();
    }
  }
  __markEnd('flush');
}

// 拓扑排序：按依赖层级排序更新
function topologicalSort(effects: Set<Effect | Derived>): (Effect | Derived)[] {
  const visited = new Set<Effect | Derived>();
  const result: (Effect | Derived)[] = [];

  function visit(effect: Effect | Derived): void {
    if (visited.has(effect)) return;
    visited.add(effect);

    // 先访问依赖
    for (const dep of effect._dependencies) {
      if (dep instanceof Effect) {
        visit(dep);
      }
    }
    result.push(effect);
  }

  for (const effect of effects) {
    visit(effect);
  }

  return result;
}

// 同步刷新（测试用）——循环直到所有层级的更新都完成
export function __flush(): void {
  __markStart('flush:sync');
  let maxIterations = 100; // 防止无限循环
  while (pendingUpdates.size > 0 && maxIterations-- > 0) {
    const updates = pendingUpdates;
    pendingUpdates = new Set();
    updateScheduled = false;
    for (const effect of updates) {
      if (effect._active) {
        effect.run();
      }
    }
  }
  __markEnd('flush:sync');
}

// 批量更新（支持嵌套）
export function __batch(fn: () => void): void {
  batchDepth++;
  const prevScheduled = updateScheduled;
  updateScheduled = true; // 暂停调度
  try {
    fn();
  } finally {
    updateScheduled = prevScheduled;
    batchDepth--;
    if (batchDepth === 0 && pendingUpdates.size > 0) {
      __flushUpdates();
    }
  }
}

// 暂停/恢复调度（用于高优先级更新）
let schedulingPaused = false;
const pausedUpdates: Set<Effect | Derived> = new Set();

export function __pauseScheduling(): void {
  schedulingPaused = true;
}

export function __resumeScheduling(): void {
  schedulingPaused = false;
  if (pausedUpdates.size > 0) {
    for (const effect of pausedUpdates) {
      __scheduleUpdate(effect);
    }
    pausedUpdates.clear();
  }
}

// ============================================
// Store - 跨组件全局状态（编译时转为信号操作）
// ============================================
// $store({ count: 0, name: 'aether' }) 编译为 __store(...)
// 每个属性变为独立 Signal，读写自动追踪

export function __store<T extends Record<string, unknown>>(initialState: T): T {
  const signals: Record<string, Signal<unknown>> = {};

  // 跟踪所有 Signals 以便在订阅时正确处理
  const proxy = new Proxy<T>({} as T, {
    get(_, key: string): unknown {
      if (key === '__signals') return signals;
      if (!signals[key]) return undefined;
      // 读取时建立订阅关系
      if (activeEffect) {
        signals[key]._subscribers.add(activeEffect);
        activeEffect._dependencies.add(signals[key]);
      }
      return signals[key]._value;
    },
    set(_, key: string, value: unknown): boolean {
      if (!signals[key]) {
        signals[key] = new Signal<unknown>(value);
      } else {
        signals[key]._value = value as Signal<unknown>['_value'];
        // 通知所有订阅者
        for (const sub of signals[key]._subscribers) {
          __scheduleUpdate(sub);
        }
      }
      return true;
    },
    has(_, key: string): boolean {
      return key in signals;
    },
    ownKeys(): string[] {
      return Object.keys(signals);
    },
    getOwnPropertyDescriptor(_, key: string): { configurable: boolean; enumerable: boolean; writable: boolean } | undefined {
      if (key in signals) {
        return { configurable: true, enumerable: true, writable: true };
      }
    }
  });

  // 初始化所有属性为信号
  for (const [key, value] of Object.entries(initialState)) {
    signals[key] = new Signal<unknown>(value);
  }

  return proxy;
}

// ============================================
// Async - 异步数据获取（编译时转为信号操作）
// ============================================
// let data = $async(() => fetch('/api')) 编译为 __async(...)
// 返回 { value, loading, error } 三个信号

export interface AsyncResource<T> {
  readonly value: T | undefined;
  readonly loading: boolean;
  readonly error: Error | null;
  refetch: () => Promise<void>;
}

export function __async<T>(fetcher: () => Promise<T>): AsyncResource<T> {
  const data = new Signal<T | undefined>(undefined);
  const loading = new Signal<boolean>(true);
  const error = new Signal<Error | null>(null);

  const resource: AsyncResource<T> = {
    get value() { return data.value; },
    get loading() { return loading.value; },
    get error() { return error.value; },
    refetch
  };

  async function refetch(): Promise<void> {
    // 使用 __batch 确保所有更新在微任务中统一批处理
    // 这样 effect 只会看到最终状态
    __batch(() => {
      loading._value = true;
      // 直接设置 _value 避免触发通知，因为我们在 batch 结束后统一通知
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

  // 立即执行
  refetch();

  return resource;
}

// HMR Global interface augmentation
declare global {
  interface Window {
    __AETHER_HMR__?: {
      componentStates?: Map<string, unknown>;
      instances?: Map<string, unknown>;
    };
  }
}

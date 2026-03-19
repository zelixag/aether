// Aether Signal Runtime - 极简响应式核心
// 目标：< 3KB minified

// ============================================
// 依赖追踪
// ============================================

// 当前正在执行的 effect/derived，用于自动收集依赖
let activeEffect = null;
const effectStack = [];

export function __pushEffect(effect) {
  effectStack.push(activeEffect);
  activeEffect = effect;
}

export function __popEffect() {
  activeEffect = effectStack.pop();
}

// ============================================
// Signal - 响应式状态
// ============================================

export class Signal {
  constructor(value) {
    this._value = value;
    this._subscribers = new Set();
  }

  get value() {
    // 读取时，如果有活跃的 effect，自动订阅
    if (activeEffect) {
      this._subscribers.add(activeEffect);
      activeEffect._dependencies.add(this);
    }
    return this._value;
  }

  set value(newValue) {
    if (Object.is(this._value, newValue)) return;
    this._value = newValue;
    // 批量通知：收集到队列中，微任务统一执行
    for (const sub of this._subscribers) {
      __scheduleUpdate(sub);
    }
  }

  // 移除订阅者
  _unsubscribe(effect) {
    this._subscribers.delete(effect);
  }
}

// 创建信号的工厂函数（编译器输出使用这个）
export function __signal(initialValue) {
  return new Signal(initialValue);
}

// ============================================
// Effect - 副作用
// ============================================

export class Effect {
  constructor(fn) {
    this._fn = fn;
    this._dependencies = new Set();
    this._cleanup = null;
    this._active = true;
    // 立即执行一次，建立依赖
    this.run();
  }

  run() {
    if (!this._active) return;
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
    }
  }

  _cleanupDeps() {
    for (const dep of this._dependencies) {
      dep._unsubscribe(this);
    }
    this._dependencies.clear();
  }

  dispose() {
    this._active = false;
    this._cleanupDeps();
    if (this._cleanup && typeof this._cleanup === 'function') {
      this._cleanup();
    }
  }
}

export function __effect(fn) {
  return new Effect(fn);
}

// ============================================
// Derived - 派生计算（带缓存）
// ============================================

export class Derived {
  constructor(fn) {
    this._fn = fn;
    this._signal = new Signal(undefined);
    this._dependencies = new Set();
    this._dirty = true;
    // 初次计算
    this._compute();
  }

  _compute() {
    this._cleanupDeps();
    __pushEffect(this);
    try {
      this._signal._value = this._fn();
      this._dirty = false;
    } finally {
      __popEffect();
    }
  }

  // Derived 被通知更新时，标记为 dirty 并传播通知
  run() {
    if (this._dirty) return; // 已经 dirty，无需重复通知
    this._dirty = true;
    // 不立即重新计算——延迟到下次 .value 读取时
    // 但需要通知下游订阅者（它们也需要标记为 dirty 或重新执行）
    for (const sub of this._signal._subscribers) {
      __scheduleUpdate(sub);
    }
  }

  get value() {
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

  _cleanupDeps() {
    for (const dep of this._dependencies) {
      dep._unsubscribe(this);
    }
    this._dependencies.clear();
  }
}

export function __derived(fn) {
  return new Derived(fn);
}

// ============================================
// 批量更新调度器
// ============================================

let pendingUpdates = new Set();
let updateScheduled = false;

function __scheduleUpdate(effect) {
  pendingUpdates.add(effect);
  if (!updateScheduled) {
    updateScheduled = true;
    queueMicrotask(__flushUpdates);
  }
}

function __flushUpdates() {
  const updates = pendingUpdates;
  pendingUpdates = new Set();
  updateScheduled = false;
  for (const effect of updates) {
    effect.run();
  }
}

// 同步刷新（测试用）——循环直到所有层级的更新都完成
export function __flush() {
  let maxIterations = 100; // 防止无限循环
  while (pendingUpdates.size > 0 && maxIterations-- > 0) {
    __flushUpdates();
  }
}

// 同步批量更新（编译器使用）
export function __batch(fn) {
  const prevScheduled = updateScheduled;
  updateScheduled = true; // 暂停调度
  try {
    fn();
  } finally {
    updateScheduled = prevScheduled;
    if (!updateScheduled && pendingUpdates.size > 0) {
      __flushUpdates();
    }
  }
}

// ============================================
// Store - 跨组件全局状态（编译时转为信号操作）
// ============================================
// $store({ count: 0, name: 'aether' }) 编译为 __store(...)
// 每个属性变为独立 Signal，读写自动追踪

export function __store(initialState) {
  const signals = {};
  const proxy = new Proxy({}, {
    get(_, key) {
      if (key === '__signals') return signals;
      if (!signals[key]) return undefined;
      return signals[key].value;
    },
    set(_, key, value) {
      if (!signals[key]) {
        signals[key] = new Signal(value);
      } else {
        signals[key].value = value;
      }
      return true;
    },
    has(_, key) {
      return key in signals;
    },
    ownKeys() {
      return Object.keys(signals);
    },
    getOwnPropertyDescriptor(_, key) {
      if (key in signals) {
        return { configurable: true, enumerable: true, writable: true };
      }
    }
  });

  // 初始化所有属性为信号
  for (const [key, value] of Object.entries(initialState)) {
    signals[key] = new Signal(value);
  }

  return proxy;
}

// ============================================
// Async - 异步数据获取（编译时转为信号操作）
// ============================================
// let data = $async(() => fetch('/api')) 编译为 __async(...)
// 返回 { value, loading, error } 三个信号

export function __async(fetcher) {
  const data = new Signal(undefined);
  const loading = new Signal(true);
  const error = new Signal(null);

  const resource = {
    get value() { return data.value; },
    get loading() { return loading.value; },
    get error() { return error.value; },
    refetch
  };

  async function refetch() {
    loading._value = true;
    // 直接设置避免多次通知，用 batch
    error._value = null;
    // 通知 loading 变化
    for (const sub of loading._subscribers) {
      __scheduleUpdate(sub);
    }

    try {
      const result = await fetcher();
      data.value = result;
      loading.value = false;
    } catch (e) {
      error.value = e;
      loading.value = false;
    }
  }

  // 立即执行
  refetch();

  return resource;
}

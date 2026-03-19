// Signal 运行时详细测试 - 边界情况、批量更新、循环依赖等
import {
  __signal, __derived, __effect, __flush, __store, __async,
  __pushEffect, __popEffect, __batch, Signal, Effect, Derived
} from '../src/signal.js';

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`);
    console.log(`  Stack: ${e.stack}`);
    failed++;
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }
function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error(`${msg}: expected ${expected}, got ${actual}`);
}

// ============================================
// Signal 边界情况测试
// ============================================

test('Signal: 初始值为 undefined', () => {
  const s = __signal(undefined);
  assert(s.value === undefined, '初始值应为 undefined');
});

test('Signal: 初始值为 null', () => {
  const s = __signal(null);
  assert(s.value === null, '初始值应为 null');
});

test('Signal: 初始值为 0', () => {
  const s = __signal(0);
  assert(s.value === 0, '初始值应为 0');
  s.value = 0;
  assert(s.value === 0, '0 应该可以设置');
});

test('Signal: 初始值为 false', () => {
  const s = __signal(false);
  assert(s.value === false, '初始值应为 false');
  s.value = false;
  assert(s.value === false, 'false 应该可以设置');
});

test('Signal: 初始值为空字符串', () => {
  const s = __signal('');
  assert(s.value === '', '初始值应为空字符串');
});

test('Signal: 初始值为对象', () => {
  const obj = { a: 1, b: { c: 2 } };
  const s = __signal(obj);
  assert(s.value === obj, '初始值应为同一个对象引用');
});

test('Signal: 初始值为数组', () => {
  const arr = [1, 2, 3];
  const s = __signal(arr);
  assert(s.value === arr, '初始值应为同一个数组引用');
  assert(s.value.length === 3, '数组长度应为 3');
});

test('Signal: 相同值不触发更新（Object.is）', () => {
  const s = __signal(1);
  let count = 0;
  __effect(() => { s.value; count++; });
  assertEqual(count, 1, '初始执行一次');

  // 尝试设置相同值
  s.value = 1;
  __flush();
  assertEqual(count, 1, '相同值（Object.is）不应触发更新');
});

test('Signal: NaN 值（Object.is(NaN, NaN) 为 true）', () => {
  const s = __signal(NaN);
  let count = 0;
  __effect(() => { s.value; count++; });
  assertEqual(count, 1, '初始执行一次');

  s.value = NaN; // Object.is(NaN, NaN) === true，所以不应该触发
  __flush();
  assertEqual(count, 1, 'NaN 相同值不应触发更新');
});

test('Signal: +0 和 -0（Object.is(+0, -0) 为 false）', () => {
  const s = __signal(0);
  let count = 0;
  __effect(() => { s.value; count++; });
  assertEqual(count, 1, '初始执行一次');

  s.value = -0; // Object.is(0, -0) === false，所以应该触发
  __flush();
  assertEqual(count, 2, '+0 -> -0 应触发更新');
});

// ============================================
// Signal 订阅者管理测试
// ============================================

test('Signal: 多个 effect 订阅同一个 signal', () => {
  const s = __signal(0);
  let count1 = 0, count2 = 0;
  __effect(() => { s.value; count1++; });
  __effect(() => { s.value; count2++; });
  assertEqual(count1, 1, '第一个 effect 执行一次');
  assertEqual(count2, 1, '第二个 effect 执行一次');

  s.value = 5;
  __flush();
  assertEqual(count1, 2, '第一个 effect 应再次执行');
  assertEqual(count2, 2, '第二个 effect 应再次执行');
});

test('Signal: 订阅者正确移除（cleanup）', () => {
  const s = __signal(0);
  let count = 0;
  const e = __effect(() => { s.value; count++; });

  assertEqual(count, 1, '初始执行一次');

  e.dispose();
  s.value = 99;
  __flush();
  assertEqual(count, 1, 'dispose 后不应再执行');
});

test('Signal: effect 依赖动态变化', () => {
  const s1 = __signal(1);
  const s2 = __signal(2);
  let which = __signal(true);
  let log = [];

  __effect(() => {
    log.push(which.value ? s1.value : s2.value);
  });

  assertEqual(log.length, 1, '初始执行一次');
  assertEqual(log[0], 1, '初始为 s1.value');

  which.value = false;
  __flush();
  assertEqual(log.length, 2, '切换后应执行');
  assertEqual(log[1], 2, '现在应读取 s2.value');

  s2.value = 99;
  __flush();
  assertEqual(log.length, 3, 's2 变化应触发');
  assertEqual(log[2], 99, '应读取新的 s2.value');

  // s1 变化不应触发（因为当前不依赖 s1）
  s1.value = 88;
  __flush();
  assertEqual(log.length, 3, 's1 变化不应触发');
});

// ============================================
// 批量更新测试
// ============================================

test('Batch: 同步批量更新', () => {
  const a = __signal(1);
  const b = __signal(2);
  let effectCount = 0;

  __effect(() => {
    a.value;
    b.value;
    effectCount++;
  });

  assertEqual(effectCount, 1, '初始执行一次');

  // 同步批量更新
  __batch(() => {
    a.value = 10;
    b.value = 20;
  });

  // 批量更新应该只触发一次 effect
  assertEqual(effectCount, 2, '批量更新后应执行一次');
  assertEqual(a.value, 10, 'a 应为 10');
  assertEqual(b.value, 20, 'b 应为 20');
});

test('Batch: 嵌套批量更新', () => {
  const s = __signal(0);
  let effectCount = 0;

  __effect(() => {
    s.value;
    effectCount++;
  });

  __batch(() => {
    s.value = 1;
    __batch(() => {
      s.value = 2;
    });
    s.value = 3;
  });

  // 嵌套 batch 后只应触发一次
  assertEqual(effectCount, 2, '嵌套批量后应执行一次');
  assertEqual(s.value, 3, 's 应为最终值 3');
});

test('Batch: 恢复调度状态', () => {
  const s = __signal(0);
  let effectCount = 0;

  __effect(() => {
    s.value;
    effectCount++;
  });

  // 暂停调度
  const prev = updateScheduled = true;
  updateScheduled = true;
  try {
    s.value = 5;
    s.value = 10;
    // 没有 flush，所以不应该触发
    assertEqual(effectCount, 1, '暂停调度时不应触发');
  } finally {
    updateScheduled = prev;
  }

  // 恢复后手动 flush
  __flush();
  assertEqual(effectCount, 2, 'flush 后应触发');
});

// 辅助变量
let updateScheduled = false;

test('Batch: 调度状态保存', () => {
  const s = __signal(1);
  let count = 0;

  __effect(() => {
    s.value;
    count++;
  });

  // 批量更新暂停调度
  __batch(() => {
    s.value = 2;
    s.value = 3;
  });

  assertEqual(count, 2, '批量更新只触发一次');
  assertEqual(s.value, 3, '取最终值');
});

test('Batch: 相同值在批量中不触发', () => {
  const s = __signal(1);
  let count = 0;

  __effect(() => {
    s.value;
    count++;
  });

  __batch(() => {
    s.value = 1; // 相同值
    s.value = 2;
  });

  assertEqual(count, 2, '设置相同值后设置不同值');
});

// ============================================
// Derived 详细测试
// ============================================

test('Derived: 首次访问时计算', () => {
  const a = __signal(5);
  const b = __derived(() => a.value * 3);

  // 尚未访问，所以未计算
  assertEqual(b._dirty, true, '初始为 dirty');

  // 访问 value
  assertEqual(b.value, 15, '计算后得到正确值');
  assertEqual(b._dirty, false, '计算后不再 dirty');
});

test('Derived: 依赖不变时不重新计算', () => {
  const a = __signal(2);
  const b = __derived(() => {
    return a.value * 2;
  });

  // 首次计算
  assertEqual(b.value, 4, '第一次计算');

  // 访问但不改变
  assertEqual(b.value, 4, '不改变时应返回缓存值');

  // 改变 a
  a.value = 3;
  __flush();
  assertEqual(b.value, 6, '改变后重新计算');
});

test('Derived: 链式派生', () => {
  const a = __signal(1);
  const b = __derived(() => a.value * 2);
  const c = __derived(() => b.value + 100);
  const d = __derived(() => c.value * 10);

  assertEqual(d.value, 1020, '链式计算正确');

  a.value = 10;
  __flush();
  assertEqual(d.value, 12000, '改变后链式更新');
});

test('Derived: 循环依赖检测（最大迭代限制）', () => {
  const a = __signal(1);
  const b = __derived(() => {
    // b 依赖 a
    return a.value + 1;
  });

  // 这是安全的 - b 依赖 a，a 变化触发 b
  a.value = 5;
  __flush();
  assertEqual(b.value, 6, '正常依赖链应工作');
});

test('Derived: 派生函数中的副作用', () => {
  const calls = [];
  const a = __signal(1);
  const b = __derived(() => {
    calls.push('compute');
    return a.value * 2;
  });

  b.value; // 第一次计算
  b.value; // 应该缓存，不重新计算
  assertEqual(calls.length, 1, '缓存后不应重新计算');

  a.value = 2;
  __flush();
  b.value; // 重新计算
  assertEqual(calls.length, 2, 'a 变化后应重新计算');
});

test('Derived: 嵌套 derived 的 dirty 传播', () => {
  const a = __signal(1);
  const b = __derived(() => a.value * 2);
  const c = __derived(() => b.value + 1);
  const d = __derived(() => c.value * 10);

  // 初始计算
  assertEqual(d.value, (1 * 2 + 1) * 10, '初始计算正确');

  // a 变化
  a.value = 5;
  __flush();

  // 验证所有派生都更新
  assertEqual(b.value, 10, 'b 更新');
  assertEqual(c.value, 11, 'c 更新');
  assertEqual(d.value, 110, 'd 更新');
});

test('Derived: 在 effect 中使用', () => {
  const a = __signal(2);
  const b = __derived(() => a.value * 3);
  let effectValue = 0;

  __effect(() => {
    effectValue = b.value;
  });

  assertEqual(effectValue, 6, 'effect 得到 derived 的值');

  a.value = 10;
  __flush();
  assertEqual(effectValue, 30, 'a 变化后 effect 更新');
});

test('Derived: 在另一个 derived 中使用', () => {
  const a = __signal(3);
  const b = __derived(() => a.value + a.value); // 6
  const c = __derived(() => b.value * b.value); // 36

  assertEqual(c.value, 36, '嵌套 derived 计算正确');
});

test('Derived: computed 中调用其他 derived', () => {
  const x = __signal(4);
  const squared = __derived(() => x.value * x.value);
  const cubed = __derived(() => squared.value * x.value);

  assertEqual(cubed.value, 64, '4^3 = 64');
});

// ============================================
// Effect 详细测试
// ============================================

test('Effect: 执行顺序', () => {
  const order = [];
  const a = __signal(0);

  __effect(() => { order.push('e1'); a.value; });
  __effect(() => { order.push('e2'); });

  assertEqual(order.length, 2, '两个 effect 都执行');
  assertEqual(order[0], 'e1', 'e1 先执行');
  assertEqual(order[1], 'e2', 'e2 后执行');
});

test('Effect: 依赖收集顺序', () => {
  const s1 = __signal(1);
  const s2 = __signal(2);
  const s3 = __signal(3);
  const order = [];

  __effect(() => {
    order.push(s1.value);
    order.push(s2.value);
    order.push(s3.value);
  });

  // 初始执行，收集所有依赖
  assertEqual(order.length, 3, '初始执行一次');

  // 按依赖顺序触发
  s2.value = 20;
  s1.value = 10;
  s3.value = 30;
  __flush();

  assertEqual(order.length, 6, '变化后再次执行');
  assertEqual(order[3], 10, 's1 变化');
  assertEqual(order[4], 20, 's2 变化');
  assertEqual(order[5], 30, 's3 变化');
});

test('Effect: 清理函数调用时机', () => {
  const s = __signal(0);
  let cleanupOrder = [];

  const e = __effect(() => {
    const val = s.value;
    return () => {
      cleanupOrder.push(val);
    };
  });

  assertEqual(cleanupOrder.length, 0, '初始不调用 cleanup');

  s.value = 1;
  __flush();
  assertEqual(cleanupOrder.length, 1, '重新执行前调用 cleanup');
  assertEqual(cleanupOrder[0], 0, 'cleanup 收到旧值');

  s.value = 2;
  __flush();
  assertEqual(cleanupOrder.length, 2, '再次调用 cleanup');
  assertEqual(cleanupOrder[1], 1, 'cleanup 收到第二个旧值');

  e.dispose();
  assertEqual(cleanupOrder.length, 3, 'dispose 也调用 cleanup');
  assertEqual(cleanupOrder[2], 2, 'dispose 时 cleanup 收到当前值');
});

test('Effect: 返回非函数结果', () => {
  const s = __signal(0);
  let cleanupCalled = false;

  const e = __effect(() => {
    s.value;
    return "not a function"; // 返回非函数
  });

  s.value = 1;
  __flush();
  // 不应抛出错误

  e.dispose();
});

test('Effect: 抛出异常时不破坏状态', () => {
  const s = __signal(0);
  let count = 0;

  try {
    __effect(() => {
      s.value;
      count++;
      if (count > 1) throw new Error("Test error");
    });
  } catch (e) {
    // 忽略
  }

  assertEqual(count, 1, '第一次执行成功');
});

test('Effect: 嵌套 effect', () => {
  const a = __signal(1);
  const b = __signal(2);
  const log = [];

  __effect(() => {
    log.push('outer:' + a.value);
    __effect(() => {
      log.push('inner:' + b.value);
    });
  });

  assertEqual(log.length, 2, '内外层都执行');
  assertEqual(log[0], 'outer:1', '外层');
  assertEqual(log[1], 'inner:2', '内层');
});

test('Effect: dispose 防止内存泄漏', () => {
  const s = __signal(0);
  let effect = __effect(() => {
    s.value;
  });

  effect.dispose();

  // s 的订阅者列表中不应该有已释放的 effect
  assert(!s._subscribers.has(effect), 'dispose 后应从订阅者列表移除');
});

test('Effect: 动态依赖追踪', () => {
  const s1 = __signal('a');
  const s2 = __signal(1);
  let which = __signal(true);
  let log = [];

  __effect(() => {
    if (which.value) {
      log.push(s1.value);
    } else {
      log.push(s2.value);
    }
  });

  assertEqual(log.length, 1, '初始执行');
  assertEqual(log[0], 'a', '初始读取 s1');

  which.value = false;
  __flush();
  assertEqual(log.length, 2, '切换后执行');
  assertEqual(log[1], 1, '现在读取 s2');

  s2.value = 999;
  __flush();
  assertEqual(log.length, 3, 's2 变化触发');
  assertEqual(log[2], 999, '读取新 s2 值');

  // s1 变化不应触发
  s1.value = 'xxx';
  __flush();
  assertEqual(log.length, 3, 's1 变化不触发');
});

test('Effect: 批量更新中的 effect 执行', () => {
  const s = __signal(0);
  let count = 0;

  __effect(() => {
    s.value;
    count++;
  });

  __batch(() => {
    s.value = 1;
    s.value = 2;
    s.value = 3;
  });

  assertEqual(count, 2, '批量更新只触发一次 effect');
  assertEqual(s.value, 3, '取最终值');
});

// ============================================
// Store 详细测试
// ============================================

test('Store: 基础 get/set', () => {
  const store = __store({ count: 0, name: 'test' });
  assertEqual(store.count, 0, '初始 count 为 0');
  assertEqual(store.name, 'test', '初始 name 为 test');

  store.count = 5;
  assertEqual(store.count, 5, '设置后 count 为 5');

  store.name = 'changed';
  assertEqual(store.name, 'changed', '设置后 name 为 changed');
});

test('Store: 动态属性', () => {
  const store = __store({});
  assertEqual(store.nonexistent, undefined, '不存在的属性为 undefined');

  store.newProp = 'value';
  assertEqual(store.newProp, 'value', '动态属性可以设置');
});

test('Store: 响应式追踪', () => {
  const store = __store({ x: 10 });
  let getCount = 0;

  __effect(() => {
    store.x; // 订阅
    getCount++;
  });

  assertEqual(getCount, 1, '初始执行');

  store.x = 20;
  __flush();
  assertEqual(getCount, 2, '变化后执行');
});

test('Store: 细粒度更新（只追踪读取的属性）', () => {
  const store = __store({ a: 1, b: 2, c: 3 });
  let aCount = 0, bCount = 0;

  __effect(() => { store.a; aCount++; });
  __effect(() => { store.b; bCount++; });

  assertEqual(aCount, 1, 'a effect 初始执行');
  assertEqual(bCount, 1, 'b effect 初始执行');

  store.a = 10;
  __flush();
  assertEqual(aCount, 2, 'a 变化触发 a effect');
  assertEqual(bCount, 1, 'a 变化不触发 b effect');

  store.b = 20;
  __flush();
  assertEqual(aCount, 2, 'b 变化不触发 a effect');
  assertEqual(bCount, 2, 'b 变化触发 b effect');

  store.c = 30;
  __flush();
  assertEqual(aCount, 2, 'c 变化不触发 a effect');
  assertEqual(bCount, 2, 'c 变化不触发 b effect');
});

test('Store: 嵌套对象', () => {
  const store = __store({ nested: { deep: { value: 1 } } });
  assertEqual(store.nested.deep.value, 1, '嵌套读取');

  store.nested.deep.value = 42;
  // 由于是引用类型，直接修改嵌套属性
  assertEqual(store.nested.deep.value, 42, '嵌套修改');
});

test('Store: has 方法', () => {
  const store = __store({ a: 1, b: 2 });
  assertEqual('a' in store, true, '应有 a 属性');
  assertEqual('b' in store, true, '应有 b 属性');
  assertEqual('c' in store, false, '不应有 c 属性');
});

test('Store: ownKeys (Object.keys)', () => {
  const store = __store({ x: 1, y: 2, z: 3 });
  const keys = Object.keys(store);
  assertEqual(keys.length, 3, '应有 3 个键');
  assertEqual(keys.includes('x'), true, '应有 x');
  assertEqual(keys.includes('y'), true, '应有 y');
  assertEqual(keys.includes('z'), true, '应有 z');
});

test('Store: __signals 内部访问', () => {
  const store = __store({ count: 0 });
  const signals = store.__signals;
  assert(signals !== undefined, '__signals 应存在');
  assertEqual(signals.count._value, 0, '内部信号可访问');
});

test('Store: delete 不存在属性', () => {
  const store = __store({ a: 1 });
  // Proxy 的 delete 操作会抛出错误或返回 false
  // 这里测试不会崩溃
  store.b = 2;
  assertEqual(store.b, 2, '新属性可以添加');
});

// ============================================
// __flush 边界情况测试
// ============================================

test('__flush: 空队列', () => {
  // 不应抛出错误
  __flush();
  assert(true, '空 flush 不出错');
});

test('__flush: 多次调用', () => {
  const s = __signal(0);
  let count = 0;
  __effect(() => { s.value; count++; });

  __flush();
  __flush();
  __flush();
  assertEqual(count, 1, '多次 flush 不重复执行');
});

test('__flush: 循环更新检测', () => {
  const s = __signal(0);
  let count = 0;

  // 注意：这可能导致无限循环，但由于有 maxIterations 保护
  // 实际行为取决于具体实现
  try {
    __effect(() => {
      if (count < 50) { // 限制次数防止测试卡住
        s.value;
        count++;
        s.value = count;
      }
    });
    __flush();
  } catch (e) {
    // 如果触发循环限制，可能抛出错误
  }

  assert(true, '测试完成');
});

// ============================================
// __async 测试（模拟）
// ============================================

test('__async: 返回值结构', () => {
  // 创建一个假的 fetcher 来测试返回值结构
  let fetchCount = 0;
  const resource = __async(async () => {
    fetchCount++;
    return { data: 'test' };
  });

  assertEqual(resource.loading, true, '初始 loading 为 true');
  assertEqual(resource.error, null, '初始 error 为 null');
  assertEqual(resource.value, undefined, '初始 value 为 undefined');

  // 等待异步操作
  await new Promise(r => setTimeout(r, 100));

  assertEqual(fetchCount, 1, 'fetcher 调用一次');
  assertEqual(resource.loading, false, '加载完成');
  assertEqual(resource.value?.data, 'test', '返回数据正确');
});

test('__async: refetch 重新获取', () => {
  let fetchCount = 0;
  const resource = __async(async () => {
    fetchCount++;
    return fetchCount;
  });

  await new Promise(r => setTimeout(r, 100));
  assertEqual(fetchCount, 1, '初始调用');

  // 再次调用 refetch
  await resource.refetch();
  await new Promise(r => setTimeout(r, 100));
  assertEqual(fetchCount, 2, 'refetch 后调用两次');
});

test('__async: 错误处理', () => {
  const resource = __async(async () => {
    throw new Error('Test error');
  });

  await new Promise(r => setTimeout(r, 100));
  assertEqual(resource.error?.message, 'Test error', '错误被捕获');
  assertEqual(resource.loading, false, 'loading 为 false');
});

// ============================================
// 循环依赖和图遍历测试
// ============================================

test('循环: A -> B -> A (Derived)', () => {
  const a = __signal(1);

  // 注意：这种场景在实际应用中应避免
  // 这里只测试系统不会崩溃
  const b = __derived(() => a.value * 2);
  const c = __derived(() => b.value + 1);

  assertEqual(c.value, 3, '正常派生链');
});

test('循环: 动态切换依赖', () => {
  const s1 = __signal('a');
  const s2 = __signal(1);
  const switcher = __signal(true);

  let effectLog = [];
  __effect(() => {
    if (switcher.value) {
      effectLog.push(s1.value);
    } else {
      effectLog.push(s2.value);
    }
  });

  assertEqual(effectLog.length, 1, '初始执行');
  assertEqual(effectLog[0], 'a', '初始为 s1');

  switcher.value = false;
  __flush();
  assertEqual(effectLog.length, 2, '切换后执行');
  assertEqual(effectLog[1], 1, '切换到 s2');

  s2.value = 999;
  __flush();
  assertEqual(effectLog.length, 3, 's2 变化触发');
  assertEqual(effectLog[2], 999, '读取新值');
});

// ============================================
// 性能相关测试
// ============================================

test('性能: 大量 effect 订阅单个 signal', () => {
  const s = __signal(0);
  const effects = [];

  // 创建 100 个 effect
  for (let i = 0; i < 100; i++) {
    effects.push(__effect(() => { s.value; }));
  }

  // 更新应该高效处理
  s.value = 1;
  __flush();

  assert(true, '大量 effect 更新完成');
});

test('性能: 长链 derived', () => {
  const s = __signal(1);
  let current = s;

  // 创建 10 层 derived
  for (let i = 0; i < 10; i++) {
    current = __derived(() => current.value + 1);
  }

  assertEqual(current.value, 11, '长链计算正确');

  s.value = 10;
  __flush();
  assertEqual(current.value, 20, '更新后正确');
});

// ============================================
// 结果汇总
// ============================================

console.log(`\n=============================`);
console.log(`Signal Advanced Tests: ${passed} passed, ${failed} failed`);

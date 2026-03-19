// Signal 运行时测试
import { __signal, __derived, __effect, __flush } from '../src/signal.js';

let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}: ${e.message}`);
    failed++;
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

// Signal 基础
test('Signal: 读写值', () => {
  const s = __signal(0);
  assert(s.value === 0, '初始值应为 0');
  s.value = 42;
  assert(s.value === 42, '设置后应为 42');
});

test('Signal: 相同值不触发更新', () => {
  const s = __signal(1);
  let count = 0;
  __effect(() => { s.value; count++; });
  assert(count === 1, 'effect 应立即执行一次');
  s.value = 1; // 相同值
  __flush();
  assert(count === 1, '相同值不应触发更新');
});

// Derived 基础
test('Derived: 自动计算', () => {
  const a = __signal(2);
  const b = __derived(() => a.value * 3);
  assert(b.value === 6, '派生值应为 6');
});

test('Derived: 响应上游变化', () => {
  const a = __signal(5);
  const b = __derived(() => a.value + 10);
  assert(b.value === 15, '初始应为 15');
  a.value = 20;
  __flush();
  assert(b.value === 30, '更新后应为 30');
});

test('Derived: 链式派生', () => {
  const a = __signal(1);
  const b = __derived(() => a.value * 2);
  const c = __derived(() => b.value + 100);
  assert(c.value === 102, '链式初始值应为 102');
  a.value = 10;
  __flush();
  assert(c.value === 120, '链式更新后应为 120');
});

// Effect
test('Effect: 自动追踪依赖', () => {
  const s = __signal(0);
  let log = [];
  __effect(() => { log.push(s.value); });
  assert(log.length === 1 && log[0] === 0, 'effect 应立即执行');
  s.value = 1;
  __flush();
  assert(log.length === 2 && log[1] === 1, '变化后 effect 应重新执行');
});

test('Effect: 清理函数', () => {
  const s = __signal(0);
  let cleaned = false;
  const e = __effect(() => {
    s.value; // 订阅
    return () => { cleaned = true; };
  });
  assert(!cleaned, '清理函数不应立即调用');
  s.value = 1;
  __flush();
  assert(cleaned, 'effect 重新执行时应调用清理函数');
});

test('Effect: dispose 停止追踪', () => {
  const s = __signal(0);
  let count = 0;
  const e = __effect(() => { s.value; count++; });
  assert(count === 1, '初始执行一次');
  e.dispose();
  s.value = 99;
  __flush();
  assert(count === 1, 'dispose 后不应再执行');
});

console.log(`\n=============================`);
console.log(`Signal Runtime: ${passed} passed, ${failed} failed`);

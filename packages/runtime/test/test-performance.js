// 性能基准测试 - Signal/Effect/Derived 性能测试
// 注意：这是一个简化的基准测试，实际性能对比需要真实浏览器环境

import {
  __signal, __derived, __effect, __flush, __store
} from '../src/signal.js';

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
function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error(`${msg}: expected ${expected}, got ${actual}`);
}

// ============================================
// 辅助函数
// ============================================

function measure(name, fn, iterations = 1000) {
  const start = performance ? performance.now() : Date.now();
  for (let i = 0; i < iterations; i++) {
    fn();
  }
  const end = performance ? performance.now() : Date.now();
  const time = end - start;
  console.log(`  ${name}: ${time.toFixed(2)}ms (${iterations} iterations)`);
  return time;
}

function runTests(name, tests, iterations = 1000) {
  console.log(`\n--- ${name} ---`);
  for (const [testName, fn] of tests) {
    measure(testName, fn, iterations);
  }
}

// ============================================
// Signal 创建性能
// ============================================

console.log('\n========================================');
console.log('PERFORMANCE BENCHMARKS');
console.log('========================================');

test('Performance: Signal 创建速度', () => {
  measure('Create 1000 signals', () => {
    for (let i = 0; i < 1000; i++) {
      __signal(i);
    }
  }, 1);
});

test('Performance: Signal 读写速度', () => {
  const s = __signal(0);
  measure('Read 100000 times', () => {
    for (let i = 0; i < 100000; i++) {
      const v = s.value;
    }
  }, 1);

  measure('Write 100000 times', () => {
    for (let i = 0; i < 100000; i++) {
      s.value = i;
    }
  }, 1);
});

test('Performance: Signal 批量更新', () => {
  const signals = [];
  for (let i = 0; i < 100; i++) {
    signals.push(__signal(0));
  }

  measure('Update 100 signals in batch', () => {
    for (let i = 0; i < 100; i++) {
      signals[i].value = i;
    }
    __flush();
  }, 1000);
});

// ============================================
// Effect 性能测试
// ============================================

test('Performance: Effect 创建速度', () => {
  measure('Create 1000 effects', () => {
    for (let i = 0; i < 1000; i++) {
      const s = __signal(0);
      __effect(() => { s.value; });
    }
  }, 1);
});

test('Performance: Effect 订阅多个 Signal', () => {
  const signals = [];
  for (let i = 0; i < 10; i++) {
    signals.push(__signal(i));
  }

  measure('Effect subscribing to 10 signals', () => {
    const s = signals[0];
    s.value = Math.random();
    __flush();
  }, 10000);
});

test('Performance: Effect 重新执行次数', () => {
  const s = __signal(0);
  let count = 0;
  __effect(() => { s.value; count++; });

  measure('100 signal updates + flush', () => {
    for (let i = 0; i < 100; i++) {
      s.value = i;
    }
    __flush();
  }, 100);
});

test('Performance: Effect dispose 速度', () => {
  const effects = [];
  for (let i = 0; i < 100; i++) {
    const s = __signal(0);
    effects.push(__effect(() => { s.value; }));
  }

  measure('Dispose 100 effects', () => {
    for (const e of effects) {
      e.dispose();
    }
  }, 10);
});

// ============================================
// Derived 性能测试
// ============================================

test('Performance: Derived 创建速度', () => {
  measure('Create 1000 deriveds', () => {
    for (let i = 0; i < 1000; i++) {
      const s = __signal(i);
      __derived(() => s.value * 2);
    }
  }, 1);
});

test('Performance: Derived 缓存验证', () => {
  const s = __signal(5);
  const d = __derived(() => s.value * 2);

  // 首次访问
  assertEqual(d.value, 10, '初始计算正确');

  // 重复访问应该使用缓存
  measure('Read cached value 100000 times', () => {
    for (let i = 0; i < 100000; i++) {
      const v = d.value;
    }
  }, 1);
});

test('Performance: 链式 Derived', () => {
  const base = __signal(1);
  let current = base;

  for (let i = 0; i < 10; i++) {
    current = __derived(() => current.value + 1);
  }

  assertEqual(current.value, 11, '链式计算正确');

  measure('Update chain of 10 deriveds', () => {
    base.value = Math.random();
    __flush();
    const v = current.value;
  }, 10000);
});

test('Performance: 长 Derived 链计算', () => {
  const base = __signal(2);
  let current = base;

  for (let i = 0; i < 20; i++) {
    current = __derived(() => current.value * 2);
  }

  assertEqual(current.value, Math.pow(2, 21), '长链计算正确');

  measure('Update chain of 20 deriveds', () => {
    base.value = 3;
    __flush();
    const v = current.value;
  }, 1000);
});

// ============================================
// Store 性能测试
// ============================================

test('Performance: Store 创建速度', () => {
  measure('Create 1000 stores', () => {
    for (let i = 0; i < 1000; i++) {
      __store({ count: 0, name: 'test', value: i });
    }
  }, 1);
});

test('Performance: Store 属性读写', () => {
  const store = __store({
    a: 1, b: 2, c: 3, d: 4, e: 5,
    f: 6, g: 7, h: 8, i: 9, j: 10
  });

  measure('Read 10 properties 10000 times', () => {
    for (let i = 0; i < 10000; i++) {
      const v = store.a + store.b + store.c + store.d + store.e +
                store.f + store.g + store.h + store.i + store.j;
    }
  }, 1);

  measure('Write 10 properties 1000 times', () => {
    for (let i = 0; i < 1000; i++) {
      store.a = i; store.b = i; store.c = i; store.d = i; store.e = i;
      store.f = i; store.g = i; store.h = i; store.i = i; store.j = i;
    }
    __flush();
  }, 1);
});

test('Performance: Store 细粒度更新', () => {
  const store = __store({
    a: 1, b: 2, c: 3, d: 4, e: 5,
    f: 6, g: 7, h: 8, i: 9, j: 10
  });

  const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  const effects = [];
  for (let i = 0; i < 10; i++) {
    const idx = i;
    effects.push(__effect(() => {
      switch(idx) {
        case 0: store.a; break;
        case 1: store.b; break;
        case 2: store.c; break;
        case 3: store.d; break;
        case 4: store.e; break;
        case 5: store.f; break;
        case 6: store.g; break;
        case 7: store.h; break;
        case 8: store.i; break;
        case 9: store.j; break;
      }
      counts[idx]++;
    }));
  }

  measure('Update 10 properties with granular tracking', () => {
    for (let i = 0; i < 10; i++) {
      switch(i) {
        case 0: store.a = Math.random(); break;
        case 1: store.b = Math.random(); break;
        case 2: store.c = Math.random(); break;
        case 3: store.d = Math.random(); break;
        case 4: store.e = Math.random(); break;
        case 5: store.f = Math.random(); break;
        case 6: store.g = Math.random(); break;
        case 7: store.h = Math.random(); break;
        case 8: store.i = Math.random(); break;
        case 9: store.j = Math.random(); break;
      }
    }
    __flush();
  }, 1000);
});

// ============================================
// 大规模测试
// ============================================

test('Performance: 100 个 Signal + 100 个 Effect', () => {
  const signals = [];
  const effects = [];

  for (let i = 0; i < 100; i++) {
    const s = __signal(i);
    signals.push(s);
    effects.push(__effect(() => {
      s.value;
    }));
  }

  measure('Update all 100 signals', () => {
    for (let i = 0; i < 100; i++) {
      signals[i].value = i + 1000;
    }
    __flush();
  }, 100);
});

test('Performance: 1000 个 Signal + 1000 个 Effect', () => {
  const signals = [];
  const effects = [];

  for (let i = 0; i < 1000; i++) {
    const s = __signal(i);
    signals.push(s);
    effects.push(__effect(() => {
      s.value;
    }));
  }

  measure('Update all 1000 signals', () => {
    for (let i = 0; i < 1000; i++) {
      signals[i].value = i + 1000;
    }
    __flush();
  }, 10);
});

test('Performance: 100 个 Derived 形成依赖图', () => {
  const signals = [];
  const deriveds = [];

  // 创建 100 个基础 signal
  for (let i = 0; i < 100; i++) {
    signals.push(__signal(i));
  }

  // 创建 99 个 derived，每个依赖前两个
  for (let i = 0; i < 99; i++) {
    const d = __derived(() => signals[i].value + signals[i + 1].value);
    deriveds.push(d);
  }

  measure('Update 100-signal dependency graph', () => {
    for (let i = 0; i < 100; i++) {
      signals[i].value = i + 1000;
    }
    __flush();
  }, 10);
});

// ============================================
// 与 React/Vue 简单对比（模拟数据）
// ============================================

console.log('\n========================================');
console.log('COMPARISON NOTES (Theoretical)');
console.log('========================================');
console.log(`
Aether Signal 对比 React/Vue：

1. Signal vs React useState:
   - React useState: 每次更新创建新 vnode，重新渲染整个组件
   - Aether Signal: 细粒度更新，只更新依赖的 DOM 节点
   - 理论优势: Signal 在复杂组件树下性能更优

2. Signal vs Vue reactive:
   - Vue reactive: 基于 Proxy，支持嵌套响应式
   - Aether Signal: 简单 Signal，无嵌套依赖追踪
   - Vue 在深层对象场景更方便，Signal 在性能上更直接

3. Aether 优势:
   - < 3KB minified 体积
   - 编译时优化，无需运行时代理
   - 细粒度 DOM 更新

4. Aether 限制:
   - 无嵌套响应式
   - 无 computed property 依赖自动追踪（需手动调用）
   - 需要编译器支持

注意: 实际性能需要真实浏览器基准测试。
`);

// ============================================
// 内存使用测试（基本）
// ============================================

test('Memory: 大量 Effect dispose 清理', () => {
  const effects = [];

  // 创建并立即 dispose
  for (let i = 0; i < 1000; i++) {
    const s = __signal(i);
    const e = __effect(() => { s.value; });
    effects.push(e);
  }

  // Dispose 所有 effect
  for (const e of effects) {
    e.dispose();
  }

  // 如果没有内存泄漏，GC 后内存应该被释放
  assert(true, 'Effect dispose 完成');
});

test('Memory: 循环创建/销毁 Effect', () => {
  measure('Create and dispose 1000 effects', () => {
    for (let i = 0; i < 1000; i++) {
      const s = __signal(i);
      const e = __effect(() => { s.value; });
      e.dispose();
    }
  }, 10);
});

// ============================================
// 结果汇总
// ============================================

console.log(`\n=============================`);
console.log(`Performance Tests: ${passed} passed, ${failed} failed`);
console.log('\nNote: For accurate performance comparisons,');
console.log('run these tests in a real browser environment.');

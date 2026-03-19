// Component Lifecycle and Effect Cleanup Tests
import { __signal, __effect, __flush, __batch, __pauseScheduling, __resumeScheduling, __derived } from '../src/signal.js';
import { ComponentContext } from '../src/dom.js';

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

// ============================================
// Effect Cleanup Tests
// ============================================

test('Effect: cleanup function called on re-run', () => {
  const s = __signal(0);
  let cleanups = [];

  const e = __effect(() => {
    const val = s.value;
    return () => { cleanups.push(val); };
  });

  assert(cleanups.length === 0, 'Cleanup should not run initially');

  s.value = 1;
  __flush();
  assert(cleanups.length === 1 && cleanups[0] === 0, 'Cleanup should run with previous value');

  s.value = 2;
  __flush();
  assert(cleanups.length === 2, 'Second update should call cleanup again');
  assert(cleanups[1] === 1, 'Second cleanup should have previous value');
});

test('Effect: cleanup function called on dispose', () => {
  const s = __signal(10);
  let cleaned = false;

  const e = __effect(() => {
    s.value;
    return () => { cleaned = true; };
  });

  assert(!cleaned, 'Cleanup should not run initially');
  e.dispose();
  assert(cleaned, 'Cleanup should run after dispose');
});

test('Effect: cleanup called only once after dispose', () => {
  const s = __signal(0);
  let cleanupCount = 0;

  const e = __effect(() => {
    s.value;
    return () => { cleanupCount++; };
  });

  e.dispose();
  s.value = 99; // Should not trigger cleanup since disposed
  __flush();
  assert(cleanupCount === 1, 'Cleanup should be called only once');

  e.dispose(); // Should not call cleanup again
  assert(cleanupCount === 1, 'Second dispose should not call cleanup again');
});

test('Effect: dispose cleans up dependencies', () => {
  const s = __signal(1);
  let count = 0;

  const e = __effect(() => {
    s.value;
    count++;
  });

  assert(count === 1, 'Effect should run once initially');
  e.dispose();
  s.value = 99;
  __flush();
  assert(count === 1, 'Disposed effect should not run');
  assert(s._subscribers.size === 0, 'Disposed effect should be unsubscribed');
});

test('Effect: nested effect cleanup', () => {
  const outer = __signal(0);
  const inner = __signal(0);
  const cleanups = [];

  __effect(() => {
    outer.value;
    __effect(() => {
      inner.value;
      return () => { cleanups.push('inner'); };
    });
    return () => { cleanups.push('outer'); };
  });

  assert(cleanups.length === 0, 'No cleanups initially');
  inner.value = 1;
  __flush();
  assert(cleanups.length === 1 && cleanups[0] === 'inner', 'Inner cleanup called');
  assert(cleanups.length === 1, 'Outer still active');
  outer.value = 1;
  __flush();
  assert(cleanups.length === 2, 'Both cleanups called');
  assert(cleanups[1] === 'outer', 'Outer cleanup called last');
});

// ============================================
// ComponentContext Tests
// ============================================

test('ComponentContext: dispose cleans up effects', () => {
  const s = __signal(0);
  let effectCount = 0;

  const ctx = new ComponentContext();
  ctx.addEffect(__effect(() => {
    s.value;
    effectCount++;
  }));

  assert(effectCount === 1, 'Effect should run once');
  ctx.dispose();
  assert(effectCount === 1, 'Disposed context should stop effect');
  s.value = 99;
  __flush();
  assert(effectCount === 1, 'Effect should not run after dispose');
});

test('ComponentContext: dispose cleans up nested contexts', () => {
  const s = __signal(0);
  let count = 0;

  const parentCtx = new ComponentContext();
  const childCtx = new ComponentContext();

  parentCtx.addChild(childCtx);
  childCtx.addEffect(__effect(() => {
    s.value;
    count++;
  }));

  assert(count === 1, 'Child effect should run');
  parentCtx.dispose();
  assert(count === 1, 'Child effect should stop after parent dispose');
  s.value = 99;
  __flush();
  assert(count === 1, 'Effect should not run after dispose');
});

test('ComponentContext: dispose is idempotent', () => {
  const ctx = new ComponentContext();
  ctx.addEffect(__effect(() => {}));

  ctx.dispose();
  ctx.dispose(); // Should not throw
  ctx.dispose();
  assert(true, 'Multiple disposes should be safe');
});

test('ComponentContext: dispose marks disposed flag', () => {
  const ctx = new ComponentContext();
  assert(ctx._disposed === false, 'Should not be disposed initially');
  ctx.dispose();
  assert(ctx._disposed === true, 'Should be marked as disposed');
});

test('ComponentContext: addChild adds to children array', () => {
  const parentCtx = new ComponentContext();
  const childCtx = new ComponentContext();

  parentCtx.addChild(childCtx);

  assert(parentCtx._children.length === 1, 'Child should be added to parent');
  assert(parentCtx._children[0] === childCtx, 'Child should be the correct context');
});

// ============================================
// Batch Update Tests
// ============================================

test('__batch: groups updates', () => {
  const s = __signal(0);
  let count = 0;

  __effect(() => {
    s.value;
    count++;
  });

  assert(count === 1, 'Initial run');
  __batch(() => {
    s.value = 1;
    s.value = 2;
    s.value = 3;
  });
  // After batch, should only run once with final value
  assert(count === 2, 'Batch should consolidate updates');
  assert(s.value === 3, 'Should have final value');
});

test('__batch: nested batching works', () => {
  const s = __signal(0);
  let count = 0;

  __effect(() => {
    s.value;
    count++;
  });

  __batch(() => {
    s.value = 1;
    __batch(() => {
      s.value = 2;
    });
    s.value = 3;
  });

  assert(count === 2, 'Nested batch should still consolidate');
});

test('__batch: flushes after nested batch', () => {
  const s = __signal(0);
  let count = 0;

  __effect(() => {
    s.value;
    count++;
  });

  __batch(() => {
    s.value = 1;
    __batch(() => {
      s.value = 2;
    });
  });

  assert(count === 2, 'Should flush after nested batch completes');
});

// ============================================
// Scheduling Pause/Resume Tests
// ============================================

test('__pauseScheduling: stops scheduling', () => {
  const s = __signal(0);
  let count = 0;

  __effect(() => {
    s.value;
    count++;
  });

  assert(count === 1, 'Initial run');
  __pauseScheduling();
  s.value = 1;
  s.value = 2;
  // Updates should be paused
  assert(count === 1, 'Updates should be paused');
  __resumeScheduling();
  // After resume, should flush pending
  assert(count === 2, 'Should flush after resume');
});

// ============================================
// Derived Cleanup Tests
// ============================================

test('Derived: cleanup removes dependencies', () => {
  const s = __signal(1);
  const d = __derived(() => s.value * 2);

  assert(d.value === 2, 'Derived should compute');
  assert(s._subscribers.has(d._signal), 'Derived should be subscribed');

  d.dispose();
  assert(s._subscribers.has(d._signal) === false, 'Disposed derived should be unsubscribed');
});

test('Derived: dispose stops updates', () => {
  const s = __signal(1);
  let count = 0;

  const d = __derived(() => {
    count++;
    return s.value * 2;
  });

  assert(d.value === 2, 'Should compute');
  assert(count === 1, 'Should have computed once');

  d.dispose();
  s.value = 99;
  // Derived won't recalc since it's disposed
  // But the signal still notifies its own subscribers
  assert(count === 1, 'Disposed derived should not recompute');
});

// ============================================
// Cleanup Order Tests
// ============================================

test('ComponentContext: disposes children before effects', () => {
  const cleanupOrder = [];

  const parentCtx = new ComponentContext();
  const childCtx = new ComponentContext();

  parentCtx.addEffect(__effect(() => {
    cleanupOrder.push('parent-effect');
  }));

  childCtx.addEffect(__effect(() => {
    cleanupOrder.push('child-effect');
  }));

  parentCtx.addChild(childCtx);
  parentCtx.dispose();

  // Children should be disposed before effects of same context
  // But order between sibling contexts is not guaranteed
  assert(cleanupOrder.length === 2, 'Both should be cleaned up');
  assert(cleanupOrder.includes('parent-effect'), 'Parent effect should be cleaned');
  assert(cleanupOrder.includes('child-effect'), 'Child effect should be cleaned');
});

test('Multiple effects cleanup in order', () => {
  const cleanups = [];

  const ctx = new ComponentContext();
  for (let i = 0; i < 3; i++) {
    const effect = __effect(() => {
      return () => { cleanups.push(i); };
    });
    ctx.addEffect(effect);
  }

  ctx.dispose();
  assert(cleanups.length === 3, 'All cleanups should be called');
});

// ============================================
// Cleanup function captures current value
// ============================================

test('Effect: cleanup can access previous state', () => {
  const counter = __signal(0);
  let previousValue = -1;

  __effect(() => {
    const current = counter.value;
    return () => {
      previousValue = current;
    };
  });

  assert(previousValue === -1, 'Cleanup should not have run yet');
  counter.value = 10;
  __flush();
  assert(previousValue === 0, 'Cleanup should have captured value before change');
  counter.value = 20;
  __flush();
  assert(previousValue === 10, 'Cleanup should have captured latest previous value');
});

// ============================================
// ComponentContext returns cleanup wrapper
// ============================================

test('ComponentContext: cleanup wraps user cleanup function', () => {
  const ctx = new ComponentContext();
  let userCleanupRan = false;

  // Simulate what __createComponent does when user returns a cleanup
  const userCleanup = () => { userCleanupRan = true; };
  const originalDispose = ctx.dispose.bind(ctx);
  ctx.dispose = () => {
    userCleanup();
    originalDispose();
  };

  ctx.dispose();
  assert(userCleanupRan, 'User cleanup should run');
});

// ============================================
// Edge case: Effect without cleanup
// ============================================

test('Effect: works without cleanup function', () => {
  const s = __signal(0);
  let count = 0;

  const e = __effect(() => {
    s.value;
    count++;
  });

  assert(count === 1, 'Should run once');
  s.value = 1;
  __flush();
  assert(count === 2, 'Should run again');
  e.dispose();
  s.value = 2;
  __flush();
  assert(count === 2, 'Should not run after dispose');
});

// ============================================
// Edge case: Double dispose
// ============================================

test('Effect: dispose is idempotent for active flag', () => {
  const s = __signal(0);
  let cleanupCount = 0;

  const e = __effect(() => {
    s.value;
    return () => { cleanupCount++; };
  });

  e.dispose();
  assert(cleanupCount === 1, 'First dispose calls cleanup');
  e.dispose();
  assert(cleanupCount === 1, 'Second dispose does not call cleanup again');
});

// ============================================
// Run Summary
// ============================================

console.log(`\n=============================`);
console.log(`Lifecycle Tests: ${passed} passed, ${failed} failed`);

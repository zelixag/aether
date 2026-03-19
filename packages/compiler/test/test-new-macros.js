// 新宏测试: $store, $async, $style
import { transformAsync } from '@babel/core';
import aetherPlugin from '../src/index.js';

const testCases = [
  {
    name: '$store 转换',
    input: `
import { $store } from 'aether'
const store = $store({ count: 0, theme: 'dark' })
console.log(store.count)
store.count = 5
`,
    check(output) {
      assert(output.includes('__store'), '应将 $store 替换为 __store');
      assert(!output.includes('$store'), '不应残留 $store');
      // store 不需要 .value 转换（Proxy 自动处理）
      assert(output.includes('store.count'), 'store.count 应保持原样（Proxy 处理）');
    }
  },
  {
    name: '$async 转换',
    input: `
import { $async } from 'aether'
const data = $async(() => fetch('/api'))
console.log(data.loading)
console.log(data.value)
`,
    check(output) {
      assert(output.includes('__async'), '应将 $async 替换为 __async');
      assert(!output.includes('$async'), '不应残留 $async');
      assert(output.includes('data.loading'), 'data.loading 应保持原样');
      assert(output.includes('data.value'), 'data.value 应保持原样');
    }
  },
  {
    name: '$store + $state 混合使用',
    input: `
import { $state, $store } from 'aether'
let count = $state(0)
const store = $store({ theme: 'dark' })
console.log(count)
console.log(store.theme)
count++
`,
    check(output) {
      assert(output.includes('__signal'), '$state 应转为 __signal');
      assert(output.includes('__store'), '$store 应转为 __store');
      assert(output.includes('count.value'), 'count 读取应转为 count.value');
      assert(output.includes('count.value++'), 'count++ 应转为 count.value++');
      assert(output.includes('store.theme'), 'store.theme 应保持原样');
    }
  },
  {
    name: '全部宏导入',
    input: `
import { $state, $derived, $effect, $store, $async, mount } from 'aether'
let x = $state(1)
let y = $derived(() => x * 2)
$effect(() => console.log(x))
const s = $store({ a: 1 })
const d = $async(() => fetch('/'))
mount(App, '#app')
`,
    check(output) {
      assert(output.includes('__signal'), '有 __signal');
      assert(output.includes('__derived'), '有 __derived');
      assert(output.includes('__effect'), '有 __effect');
      assert(output.includes('__store'), '有 __store');
      assert(output.includes('__async'), '有 __async');
      assert(output.includes('mount'), '保留 mount');
      assert(!output.includes('$state'), '无 $state 残留');
      assert(!output.includes('$derived'), '无 $derived 残留');
    }
  },
];

let passed = 0, failed = 0;

for (const tc of testCases) {
  try {
    const result = await transformAsync(tc.input, {
      filename: 'test.jsx',
      plugins: ['@babel/plugin-syntax-jsx', aetherPlugin],
    });

    console.log(`\n--- ${tc.name} ---`);
    console.log('Output:');
    console.log(result.code);
    tc.check(result.code);
    console.log(`✓ PASSED`);
    passed++;
  } catch (e) {
    console.log(`\n--- ${tc.name} ---`);
    console.log(`✗ FAILED: ${e.message}`);
    failed++;
  }
}

console.log(`\n=============================`);
console.log(`New Macros: ${passed} passed, ${failed} failed`);

function assert(cond, msg) { if (!cond) throw new Error(msg); }

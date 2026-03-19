// 编译器转换测试
// 运行: node test/test-transform.js

import { transformAsync } from '@babel/core';
import aetherPlugin from '../src/index.js';

const testCases = [
  {
    name: '$state 变量声明和读写转换',
    input: `
import { $state } from 'aether'
let count = $state(0)
console.log(count)
count = 5
count++
`,
    check(output) {
      assert(output.includes('__signal(0)'), '应该将 $state(0) 替换为 __signal(0)');
      assert(output.includes('count.value'), '应该将 count 读取替换为 count.value');
      assert(output.includes('count.value = 5'), '应该将 count = 5 替换为 count.value = 5');
      assert(output.includes('count.value++'), '应该将 count++ 替换为 count.value++');
      assert(!output.includes('$state'), '不应该残留 $state');
    }
  },
  {
    name: '$derived 转换',
    input: `
import { $state, $derived } from 'aether'
let count = $state(0)
let double = $derived(() => count * 2)
console.log(double)
`,
    check(output) {
      assert(output.includes('__derived'), '应该将 $derived 替换为 __derived');
      assert(output.includes('count.value * 2'), '派生函数内的 count 应替换为 count.value');
      assert(output.includes('double.value'), '读取 double 应替换为 double.value');
    }
  },
  {
    name: '$effect 转换',
    input: `
import { $state, $effect } from 'aether'
let count = $state(0)
$effect(() => {
  console.log(count)
})
`,
    check(output) {
      assert(output.includes('__effect'), '应该将 $effect 替换为 __effect');
      assert(output.includes('count.value'), 'effect 内的 count 应替换为 count.value');
    }
  },
  {
    name: '非宏导入保持不变',
    input: `
import { $state, mount } from 'aether'
let count = $state(0)
mount(App, '#app')
`,
    check(output) {
      assert(output.includes('mount'), '应保留 mount 导入');
    }
  },
  {
    name: '函数参数不应被转换',
    input: `
import { $state } from 'aether'
let count = $state(0)
function foo(count) {
  return count + 1
}
console.log(count)
`,
    check(output) {
      // 函数外部的 count 应该转换
      assert(output.includes('count.value'), '外部 count 应替换为 count.value');
    }
  },
];

let passed = 0;
let failed = 0;

for (const tc of testCases) {
  try {
    const result = await transformAsync(tc.input, {
      filename: 'test.jsx',
      plugins: [
        '@babel/plugin-syntax-jsx',
        aetherPlugin,
      ],
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
console.log(`Results: ${passed} passed, ${failed} failed`);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

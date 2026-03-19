// JSX 编译测试
import { transformAsync } from '@babel/core';
import aetherPlugin from '../src/index.js';

const testCases = [
  {
    name: '基础 JSX 元素',
    input: `
import { $state } from 'aether'
let count = $state(0)
const el = <div class="app"><p>{count}</p></div>
`,
    check(output) {
      assert(output.includes('__createElement("div")'), '应创建 div 元素');
      assert(output.includes('__createElement("p")'), '应创建 p 元素');
      assert(output.includes('__bindText'), '响应式文本应使用 __bindText');
      assert(output.includes('count.value'), 'count 应替换为 count.value');
    }
  },
  {
    name: '事件处理器',
    input: `
import { $state } from 'aether'
let count = $state(0)
function inc() { count++ }
const el = <button onClick={inc}>Click</button>
`,
    check(output) {
      assert(output.includes('__setAttr'), '应设置属性');
      assert(output.includes('"onClick"'), '应设置 onClick');
    }
  },
  {
    name: '响应式属性绑定',
    input: `
import { $state } from 'aether'
let cls = $state("active")
const el = <div class={cls}>hello</div>
`,
    check(output) {
      assert(output.includes('__bindAttr'), '响应式属性应使用 __bindAttr');
      assert(output.includes('cls.value'), 'cls 应替换为 cls.value');
    }
  },
  {
    name: '组件调用',
    input: `
import { $state } from 'aether'
let count = $state(0)
function App() { return <div>app</div> }
const el = <App count={count} />
`,
    check(output) {
      assert(output.includes('__createComponent'), '组件应使用 __createComponent');
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
    if (e.code) console.log(e.code);
    failed++;
  }
}

console.log(`\n=============================`);
console.log(`Results: ${passed} passed, ${failed} failed`);

function assert(condition, msg) { if (!condition) throw new Error(msg); }

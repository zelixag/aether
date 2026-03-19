// 编译测试：验证 Aether 编译器的宏转换
import { transformAsync } from '@babel/core';
import aetherPlugin from './packages/compiler/src/index.js';

const input = `
import { $state, $derived, $effect, mount } from 'aether'

function Counter() {
  let count = $state(0)
  let double = $derived(() => count * 2)

  $effect(() => {
    console.log(\`count is \${count}\`)
  })

  function increment() {
    count++
  }

  count = 10

  return (
    <div class="counter">
      <h1>Hello</h1>
      <p>{count}</p>
      <button onClick={increment}>+1</button>
    </div>
  )
}

mount(Counter, '#app')
`;

async function test() {
  console.log('=== INPUT ===');
  console.log(input);

  const result = await transformAsync(input, {
    filename: 'test.jsx',
    plugins: [
      '@babel/plugin-syntax-jsx',
      aetherPlugin,
    ],
  });

  console.log('=== OUTPUT ===');
  console.log(result.code);

  // 验证关键转换
  const code = result.code;
  const checks = [
    ['__signal(0)', '$state → __signal'],
    ['__derived', '$derived → __derived'],
    ['__effect', '$effect → __effect'],
    ['count.value', '变量读写 → .value'],
    ['__createElement', 'JSX → __createElement'],
    ['__bindText', '动态文本 → __bindText'],
  ];

  console.log('\n=== CHECKS ===');
  let allPass = true;
  for (const [pattern, desc] of checks) {
    const pass = code.includes(pattern);
    console.log(`${pass ? '✓' : '✗'} ${desc}: ${pattern}`);
    if (!pass) allPass = false;
  }

  console.log(`\n${allPass ? '全部通过!' : '有检查未通过'}`);
}

test().catch(console.error);

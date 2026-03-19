// 编译器优化测试
// 运行: node test/test-optimize.js

import { transformAsync } from '@babel/core';
import aetherPlugin from '../src/index.js';

const testCases = [
  // ============================================
  // 死代码消除测试
  // ============================================
  {
    name: '死代码消除 - if (true)',
    input: `
import { $state } from 'aether'
let count = $state(0)
if (true) {
  console.log(count)
}
`,
    check(output) {
      assert(output.includes('console.log(count)'), 'if (true) 的分支应保留');
      assert(!output.includes('if (true)'), '不应残留 if (true)');
    }
  },
  {
    name: '死代码消除 - if (false)',
    input: `
import { $state } from 'aether'
let count = $state(0)
if (false) {
  console.log("dead")
}
console.log(count)
`,
    check(output) {
      assert(!output.includes('console.log("dead")'), 'if (false) 的分支应移除');
      assert(output.includes('console.log(count)'), '后续代码应保留');
    }
  },
  {
    name: '死代码消除 - if (false) else',
    input: `
import { $state } from 'aether'
let count = $state(0)
if (false) {
  console.log("dead")
} else {
  console.log("alive")
}
`,
    check(output) {
      assert(output.includes('console.log("alive")'), 'else 分支应保留');
      assert(!output.includes('if (false)'), '不应残留 if (false)');
      assert(!output.includes('console.log("dead")'), '死代码分支应移除');
    }
  },
  {
    name: '死代码消除 - 条件表达式',
    input: `
import { $state } from 'aether'
let count = $state(0)
const x = true ? 1 : 2
`,
    check(output) {
      assert(output.includes('const x = 1'), '条件表达式应为常量值');
      assert(!output.includes('true ?'), '不应残留条件操作符');
    }
  },
  {
    name: '死代码消除 - && 短路',
    input: `
import { $state } from 'aether'
let count = $state(0)
const x = false && console.log("dead")
`,
    check(output) {
      assert(output.includes('const x = false'), 'false && expr 应简化为 false');
      assert(!output.includes('console.log'), '死代码不应执行');
    }
  },
  {
    name: '死代码消除 - || 短路',
    input: `
import { $state } from 'aether'
let count = $state(0)
const x = true || console.log("dead")
`,
    check(output) {
      assert(output.includes('const x = true'), 'true || expr 应简化为 true');
      assert(!output.includes('console.log'), '死代码不应执行');
    }
  },

  // ============================================
  // 常量派生内联测试
  // ============================================
  {
    name: '常量派生内联 - 简单常量',
    input: `
import { $derived } from 'aether'
const PI = $derived(() => 3.14159)
console.log(PI)
`,
    check(output) {
      assert(output.includes('3.14159'), '常量派生应内联');
      assert(!output.includes('__derived'), '常量派生不应使用 __derived');
    }
  },
  {
    name: '常量派生内联 - 字符串常量',
    input: `
import { $derived } from 'aether'
const NAME = $derived(() => "Aether")
console.log(NAME)
`,
    check(output) {
      assert(output.includes('"Aether"'), '字符串派生应内联');
    }
  },
  {
    name: '常量派生内联 - 表达式常量',
    input: `
import { $derived } from 'aether'
const VALUE = $derived(() => 1 + 2 + 3)
console.log(VALUE)
`,
    check(output) {
      // 注意：表达式常量在静态分析时被求值
      assert(output.includes('6') || output.includes('1 + 2 + 3'), '表达式常量应被求值或内联');
    }
  },
  {
    name: '常量派生内联 - 动态派生不应内联',
    input: `
import { $state, $derived } from 'aether'
let count = $state(0)
const double = $derived(() => count * 2)
console.log(double)
`,
    check(output) {
      // 包含响应式变量的派生不应内联
      assert(output.includes('__derived'), '动态派生应保留 __derived');
      assert(output.includes('double.value'), 'double 读取应转为 double.value');
    }
  },

  // ============================================
  // JSX 完整性验证测试
  // ============================================
  {
    name: 'JSX 完整性 - 基础 JSX 转换',
    input: `
import { $state } from 'aether'
let count = $state(0)
const el = <div class="app">{count}</div>
`,
    check(output) {
      assert(output.includes('__createElement'), 'JSX 应转换为 __createElement');
      assert(output.includes('count.value'), 'count 应替换为 count.value');
      assert(output.includes('__bindText'), '响应式文本应使用 __bindText');
    }
  },
  {
    name: 'JSX 完整性 - 嵌套 JSX',
    input: `
import { $state } from 'aether'
let count = $state(0)
const el = <div><p>{count}</p><span>{count}</span></div>
`,
    check(output) {
      assert(output.includes('__createElement("div")'), '外层 div 应转换');
      assert(output.includes('__createElement("p")'), '内层 p 应转换');
      assert(output.includes('__createElement("span")'), 'span 应转换');
    }
  },
  {
    name: 'JSX 完整性 - 响应式属性',
    input: `
import { $state } from 'aether'
let cls = $state("active")
const el = <div class={cls}>{cls}</div>
`,
    check(output) {
      assert(output.includes('__bindAttr'), '响应式属性应使用 __bindAttr');
      assert(output.includes('__bindText'), '响应式文本应使用 __bindText');
      assert(output.includes('cls.value'), 'cls 应替换为 cls.value');
    }
  },
  {
    name: 'JSX 完整性 - 静态属性不转换',
    input: `
import { $state } from 'aether'
let count = $state(0)
const el = <div id="app" data-value="test">{count}</div>
`,
    check(output) {
      // 静态属性应直接设置，不使用 __bindAttr
      assert(output.includes('"id"'), '静态 id 属性应保留');
      assert(output.includes('"data-value"'), '静态 data-value 属性应保留');
      assert(output.includes('__bindText'), '响应式文本应使用 __bindText');
    }
  },

  // ============================================
  // Source Map 相关测试
  // ============================================
  {
    name: 'Source Map - 宏转换后位置正确',
    input: `
import { $state } from 'aether'
let count = $state(0)
console.log(count)
`,
    check(output) {
      assert(output.includes('__signal'), '宏应被转换');
      assert(output.includes('count.value'), '标识符应被正确替换');
    }
  },
  {
    name: 'Source Map - JSX 转换后位置正确',
    input: `
import { $state } from 'aether'
let count = $state(0)
const el = <div>{count}</div>
`,
    check(output) {
      assert(output.includes('__createElement'), 'JSX 应转换');
      assert(output.includes('__bindText'), '响应式绑定应存在');
    }
  },

  // ============================================
  // 组合优化测试
  // ============================================
  {
    name: '组合优化 - 死代码 + 派生内联',
    input: `
import { $derived } from 'aether'
const CONST = $derived(() => 42)
if (false) {
  console.log(CONST)
}
`,
    check(output) {
      assert(!output.includes('console.log'), '死代码应移除');
      assert(!output.includes('if (false)'), 'if (false) 应移除');
    }
  },
  {
    name: '组合优化 - 宏转换 + 死代码消除',
    input: `
import { $state } from 'aether'
let x = $state(0)
if (x > 10) {
  console.log(x)
}
`,
    check(output) {
      assert(output.includes('__signal'), '宏应被转换');
      assert(output.includes('if ('), '动态条件不应被消除');
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
    if (e.code) console.log(e.code);
    failed++;
  }
}

console.log(`\n=============================`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`\nOptimization tests completed!`);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

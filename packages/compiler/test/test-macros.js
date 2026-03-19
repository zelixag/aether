// 宏转换详细测试 - 测试 $state, $derived, $effect, $store, $async 的各种用法
import { transformAsync } from '@babel/core';
import aetherPlugin from '../src/index.js';

let passed = 0, failed = 0;

async function runTest(name, input, checks) {
  try {
    const result = await transformAsync(input, {
      filename: 'test.jsx',
      plugins: ['@babel/plugin-syntax-jsx', aetherPlugin],
    });

    console.log(`\n--- ${name} ---`);
    console.log('Output:');
    console.log(result.code);

    for (const check of checks) {
      check(result.code);
    }
    console.log(`✓ PASSED`);
    passed++;
  } catch (e) {
    console.log(`\n--- ${name} ---`);
    console.log(`✗ FAILED: ${e.message}`);
    if (e.code) console.log(e.code);
    failed++;
  }
}

function assert(cond, msg) { if (!cond) throw new Error(msg); }

// ============================================
// $state 转换测试
// ============================================

await runTest('$state: 基础数字类型', `
import { $state } from 'aether'
let count = $state(0)
console.log(count)
count = 5
count++
`, [
  (out) => assert(out.includes('__signal(0)'), '应替换为 __signal(0)'),
  (out) => assert(out.includes('count.value'), '读取应替换为 count.value'),
  (out) => assert(out.includes('count.value = 5'), '赋值应替换为 count.value = 5'),
  (out) => assert(out.includes('count.value++'), '自增应替换为 count.value++'),
]);

await runTest('$state: 字符串类型', `
import { $state } from 'aether'
let name = $state("hello")
console.log(name)
name = "world"
`, [
  (out) => assert(out.includes('__signal("hello")'), '初始值应保留'),
  (out) => assert(out.includes('name.value'), '读取应替换为 name.value'),
  (out) => assert(out.includes('name.value = "world"'), '赋值应替换'),
]);

await runTest('$state: 对象类型', `
import { $state } from 'aether'
let user = $state({ name: "test", age: 25 })
console.log(user)
user.age = 30
`, [
  (out) => assert(out.includes('__signal({ name: "test", age: 25 })'), '对象字面量应保留'),
  (out) => assert(out.includes('user.age.value = 30'), '嵌套属性赋值应替换'),
]);

await runTest('$state: 数组类型', `
import { $state } from 'aether'
let items = $state([1, 2, 3])
console.log(items.length)
items.push(4)
`, [
  (out) => assert(out.includes('__signal(['), '数组应保留'),
  (out) => assert(out.includes('items.length'), '属性访问应替换'),
  (out) => assert(out.includes('items.value.push(4)'), '方法调用应替换'),
]);

await runTest('$state: 复合赋值运算符', `
import { $state } from 'aether'
let num = $state(10)
num += 5
num -= 3
num *= 2
num /= 4
`, [
  (out) => assert(out.includes('num.value += 5'), '+= 应替换'),
  (out) => assert(out.includes('num.value -= 3'), '-= 应替换'),
  (out) => assert(out.includes('num.value *= 2'), '*= 应替换'),
  (out) => assert(out.includes('num.value /= 4'), '/= 应替换'),
]);

await runTest('$state: 前置/后置自增自减', `
import { $state } from 'aether'
let num = $state(0)
++num
num--
`, [
  (out) => assert(out.includes('++num.value'), '前置 ++ 应替换'),
  (out) => assert(out.includes('num.value--'), '后置 -- 应替换'),
]);

await runTest('$state: 逻辑赋值运算符', `
import { $state } from 'aether'
let flag = $state(true)
flag &&= false
flag ||= true
flag ??= "default"
`, [
  (out) => assert(out.includes('flag.value &&= false'), '&&= 应替换'),
  (out) => assert(out.includes('flag.value ||= true'), '||= 应替换'),
  (out) => assert(out.includes('flag.value ??= "default"'), '??= 应替换'),
]);

await runTest('$state: 函数参数遮蔽（不应转换）', `
import { $state } from 'aether'
let count = $state(0)
function foo(count) {
  return count + 1
}
console.log(count)
`, [
  (out) => assert(out.includes('count.value'), '全局 count 应替换'),
  (out) => assert(out.includes('function foo(count)'), '参数 count 应保留'),
]);

await runTest('$state: 嵌套函数作用域', `
import { $state } from 'aether'
let x = $state(1)
function outer() {
  let y = 2
  function inner() {
    return x + y
  }
  return inner()
}
`, [
  (out) => assert(out.includes('x.value'), '嵌套引用 x 应替换'),
  (out) => assert(!out.includes('y.value'), '局部变量 y 不应替换'),
]);

await runTest('$state: 条件表达式中使用', `
import { $state } from 'aether'
let a = $state(5)
let b = $state(10)
let max = a > b ? a : b
`, [
  (out) => assert(out.includes('a.value > b.value'), '三元条件中的 state 应替换'),
]);

await runTest('$state: 逻辑表达式中使用', `
import { $state } from 'aether'
let a = $state(true)
let b = $state(false)
let result = a && b || false
`, [
  (out) => assert(out.includes('a.value && b.value'), '逻辑表达式中的 state 应替换'),
]);

await runTest('$state: 解构赋值（部分）', `
import { $state } from 'aether'
let point = $state({ x: 0, y: 0 })
point.x = 10
point.y = 20
`, [
  (out) => assert(out.includes('point.x.value = 10'), '解构后属性赋值应替换'),
]);

// ============================================
// $derived 转换测试
// ============================================

await runTest('$derived: 简单计算', `
import { $state, $derived } from 'aether'
let count = $state(0)
let double = $derived(() => count * 2)
console.log(double)
`, [
  (out) => assert(out.includes('__derived'), '应替换为 __derived'),
  (out) => assert(out.includes('count.value * 2'), '派生函数内 count 应替换'),
  (out) => assert(out.includes('double.value'), '读取 double 应替换'),
]);

await runTest('$derived: 复杂表达式', `
import { $state, $derived } from 'aether'
let a = $state(1)
let b = $state(2)
let c = $state(3)
let sum = $derived(() => a + b + c)
let avg = $derived(() => (a + b + c) / 3)
`, [
  (out) => assert(out.includes('a.value + b.value + c.value'), '多个 state 引用应替换'),
  (out) => assert(out.includes('(a.value + b.value + c.value) / 3'), '复杂表达式应替换'),
]);

await runTest('$derived: 嵌套 derived', `
import { $state, $derived } from 'aether'
let base = $state(2)
let doubled = $derived(() => base * 2)
let quadrupled = $derived(() => doubled * 2)
`, [
  (out) => assert(out.includes('base.value * 2'), '第一个 derived 应替换'),
  (out) => assert(out.includes('doubled.value * 2'), '依赖 derived 的表达式应替换'),
]);

await runTest('$derived: 条件表达式', `
import { $state, $derived } from 'aether'
let age = $state(25)
let status = $derived(() => age >= 18 ? "adult" : "minor")
`, [
  (out) => assert(out.includes('age.value >= 18'), '条件表达式应替换'),
]);

await runTest('$derived: 函数调用', `
import { $state, $derived } from 'aether'
let n = $state(4)
let isEven = $derived(() => n % 2 === 0)
`, [
  (out) => assert(out.includes('n.value % 2 === 0'), '表达式中的 state 应替换'),
]);

await runTest('$derived: 数组方法', `
import { $state, $derived } from 'aether'
let items = $state([1, 2, 3, 4, 5])
let sum = $derived(() => items.reduce((a, b) => a + b, 0))
let evens = $derived(() => items.filter(x => x % 2 === 0))
`, [
  (out) => assert(out.includes('items.value.reduce'), '数组方法内的 state 应替换'),
  (out) => assert(out.includes('items.value.filter'), 'filter 内的 state 应替换'),
]);

await runTest('$derived: 对象字面量返回值', `
import { $state, $derived } from 'aether'
let x = $state(10)
let point = $derived(() => ({ x: x, y: 20 }))
`, [
  (out) => assert(out.includes('{ x: x.value, y: 20 }'), '对象字面量内的 state 应替换'),
]);

await runTest('$derived: 模板字符串中使用', `
import { $state, $derived } from 'aether'
let name = $state("World")
let greeting = $derived(() => \`Hello, \${name}!\`)
`, [
  (out) => assert(out.includes('`Hello, ${name.value}!`'), '模板字符串内的 state 应替换'),
]);

// ============================================
// $effect 转换测试
// ============================================

await runTest('$effect: 基础用法', `
import { $state, $effect } from 'aether'
let count = $state(0)
$effect(() => {
  console.log("count is", count)
})
`, [
  (out) => assert(out.includes('__effect'), '应替换为 __effect'),
  (out) => assert(out.includes('count.value'), 'effect 内 count 应替换'),
]);

await runTest('$effect: 多个 effect', `
import { $state, $effect } from 'aether'
let a = $state(1)
let b = $state(2)
$effect(() => { console.log(a) })
$effect(() => { console.log(b) })
`, [
  (out) => assert(out.includes('a.value'), '第一个 effect 内 a 应替换'),
  (out) => assert(out.includes('b.value'), '第二个 effect 内 b 应替换'),
]);

await runTest('$effect: 清理函数', `
import { $state, $effect } from 'aether'
let active = $state(true)
$effect(() => {
  if (active) {
    return () => { console.log("cleanup") }
  }
})
`, [
  (out) => assert(out.includes('active.value'), '清理函数内 active 应替换'),
]);

await runTest('$effect: 嵌套函数调用', `
import { $state, $effect } from 'aether'
let count = $state(0)
function log() { console.log(count) }
$effect(() => { log() })
`, [
  (out) => assert(out.includes('count.value'), '间接引用 count 应替换'),
]);

await runTest('$effect: 条件触发', `
import { $state, $effect } from 'aether'
let trigger = $state(false)
$effect(() => {
  if (trigger) {
    console.log("triggered!")
  }
})
`, [
  (out) => assert(out.includes('trigger.value'), '条件判断中的 trigger 应替换'),
]);

await runTest('$effect: 循环中使用', `
import { $state, $effect } from 'aether'
let items = $state([1, 2, 3])
$effect(() => {
  items.forEach(item => console.log(item))
})
`, [
  (out) => assert(out.includes('items.value.forEach'), '循环内的 state 应替换'),
]);

// ============================================
// $store 转换测试
// ============================================

await runTest('$store: 基础对象', `
import { $store } from 'aether'
let app = $store({ count: 0, name: "test" })
console.log(app.count)
app.count = 5
`, [
  (out) => assert(out.includes('__store({ count: 0, name: "test" })'), '应替换为 __store'),
  // store 使用 Proxy，不需要 .value 转换
  (out) => assert(!out.includes('app.count.value'), 'store 属性访问不应添加 .value'),
]);

await runTest('$store: 嵌套属性', `
import { $store } from 'aether'
let user = $store({ profile: { age: 25 } })
console.log(user.profile.age)
user.profile.age = 30
`, [
  (out) => assert(out.includes('__store'), '应替换为 __store'),
  (out) => assert(!out.includes('user.profile.age.value'), 'store 嵌套属性不应添加 .value'),
]);

await runTest('$store: 多个 store', `
import { $store } from 'aether'
let store1 = $store({ a: 1 })
let store2 = $store({ b: 2 })
`, [
  (out) => assert(out.includes('__store'), '两个 store 都应转换'),
]);

// ============================================
// $async 转换测试
// ============================================

await runTest('$async: 基础用法', `
import { $async } from 'aether'
let data = $async(() => fetch("/api").then(r => r.json()))
console.log(data.value)
console.log(data.loading)
`, [
  (out) => assert(out.includes('__async'), '应替换为 __async'),
  (out) => assert(!out.includes('data.value.value'), 'async 的 value 访问不应添加 .value'),
]);

await runTest('$async: 带参数 fetcher', `
import { $state, $async } from 'aether'
let id = $state(1)
let user = $async(() => fetch(\`/api/\${id}\`).then(r => r.json()))
`, [
  (out) => assert(out.includes('__async'), '应替换为 __async'),
  (out) => assert(out.includes('id.value'), 'async 内 id 应替换'),
]);

// ============================================
// 混合使用测试
// ============================================

await runTest('混合: state + derived + effect', `
import { $state, $derived, $effect } from 'aether'
let count = $state(0)
let doubled = $derived(() => count * 2)
$effect(() => { console.log(doubled) })
count = 5
`, [
  (out) => assert(out.includes('__signal(0)'), 'state 应转换'),
  (out) => assert(out.includes('__derived'), 'derived 应转换'),
  (out) => assert(out.includes('__effect'), 'effect 应转换'),
  (out) => assert(out.includes('count.value = 5'), '赋值应转换'),
]);

await runTest('混合: 完整计数器示例', `
import { $state, $derived, $effect } from 'aether'
let count = $state(0)
let doubled = $derived(() => count * 2)
function increment() { count++ }
function decrement() { count-- }
function reset() { count = 0 }
$effect(() => { console.log("Count:", count) })
const el = <div>{count}</div>
`, [
  (out) => assert(out.includes('__signal(0)'), 'count 应转换'),
  (out) => assert(out.includes('__derived'), 'doubled 应转换'),
  (out) => assert(out.includes('__effect'), 'effect 应转换'),
  (out) => assert(out.includes('count++'), 'increment 内的 count++ 应转换'),
  (out) => assert(out.includes('count--'), 'decrement 内的 count-- 应转换'),
  (out) => assert(out.includes('count.value = 0'), 'reset 内的 count = 0 应转换'),
]);

// ============================================
// 边界情况测试
// ============================================

await runTest('边界: 空对象/数组', `
import { $state, $store } from 'aether'
let empty = $state({})
let arr = $state([])
`, [
  (out) => assert(out.includes('__signal({})'), '空对象应保留'),
  (out) => assert(out.includes('__signal([])'), '空数组应保留'),
]);

await runTest('边界: null 和 undefined', `
import { $state } from 'aether'
let n = $state(null)
let u = $state(undefined)
`, [
  (out) => assert(out.includes('__signal(null)'), 'null 应保留'),
  (out) => assert(out.includes('__signal(undefined)'), 'undefined 应保留'),
]);

await runTest('边界: 数字直接量表达式', `
import { $state } from 'aether'
let num = $state(1 + 2 * 3)
`, [
  (out) => assert(out.includes('__signal(1 + 2 * 3)'), '表达式应保留'),
]);

await runTest('边界: 字符串模板', `
import { $state } from 'aether'
let str = $state(\`hello \${"world"}\`)
`, [
  (out) => assert(out.includes('__signal(`hello ${"world"}`)'), '模板字符串应保留'),
]);

await runTest('边界: $state 嵌套调用', `
import { $state } from 'aether'
let obj = $state({ inner: $state(1) })
`, [
  (out) => assert(out.includes('__signal({ inner: $state(1) })'), '嵌套 $state 应保留原始形式'),
  (out) => assert(!out.includes('$state($state'), '不应产生 $state($state'),
]);

await runTest('边界: 函数作为初始值', `
import { $state } from 'aether'
let handler = $state(function() { return 1; })
let arrow = $state(() => 2)
`, [
  (out) => assert(out.includes('__signal(function'), '函数应保留'),
  (out) => assert(out.includes('__signal(() => 2)'), '箭头函数应保留'),
]);

await runTest('边界: 正则表达式', `
import { $state } from 'aether'
let regex = $state(/test/gi)
`, [
  (out) => assert(out.includes('__signal(/test/gi)'), '正则应保留'),
]);

await runTest('边界: 算术表达式求值顺序', `
import { $state } from 'aether'
let a = $state(1)
let b = $state(2)
let result = a + b * a - b / a
`, [
  (out) => assert(out.includes('a.value + b.value * a.value - b.value / a.value'), '复杂算术应正确替换'),
]);

// ============================================
// 负号和运算符测试
// ============================================

await runTest('运算符: 一元负号', `
import { $state } from 'aether'
let num = $state(5)
let neg = -num
`, [
  (out) => assert(out.includes('-num.value'), '一元负号应正确替换'),
]);

await runTest('运算符: 逻辑非', `
import { $state } from 'aether'
let flag = $state(false)
let not = !flag
`, [
  (out) => assert(out.includes('!flag.value'), '逻辑非应正确替换'),
]);

await runTest('运算符: typeof', `
import { $state } from 'aether'
let x = $state(42)
let t = typeof x
`, [
  (out) => assert(out.includes('typeof x.value'), 'typeof 应正确替换'),
]);

await runTest('运算符: void', `
import { $state } from 'aether'
let x = $state(10)
let v = void x
`, [
  (out) => assert(out.includes('void x.value'), 'void 应正确替换'),
]);

// ============================================
// 类组件场景测试（模拟）
// ============================================

await runTest('类场景: 组件的 render 方法', `
import { $state, $derived, $effect } from 'aether'
class Counter {
  constructor() {
    this.count = $state(0)
  }
  get doubled() {
    return $derived(() => this.count * 2)
  }
  render() {
    return <div>{this.count}</div>
  }
}
`, [
  // 注意：由于编译时无法完全理解类语义，这里的转换可能有限
  // 主要测试是确保不产生语法错误
  (out) => assert(out.includes('__signal(0)'), '类属性中的 $state 应转换'),
]);

// ============================================
// 结果汇总
// ============================================

console.log(`\n=============================`);
console.log(`Macro Transform Tests: ${passed} passed, ${failed} failed`);

// JSX 转换详细测试 - 各种 JSX 模式
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
// 基础元素测试
// ============================================

await runTest('JSX 基础: 简单 div', `
import { $state } from 'aether'
const el = <div>Hello</div>
`, [
  (out) => assert(out.includes('__createElement("div")'), '应创建 div'),
  (out) => assert(out.includes('__createText'), '应创建文本'),
  (out) => assert(out.includes('"Hello"'), '文本内容应保留'),
]);

await runTest('JSX 基础: 嵌套元素', `
import { $state } from 'aether'
const el = <div><p><span>text</span></p></div>
`, [
  (out) => assert(out.includes('__createElement("div")'), '应创建 div'),
  (out) => assert(out.includes('__createElement("p")'), '应创建 p'),
  (out) => assert(out.includes('__createElement("span")'), '应创建 span'),
  (out) => assert(out.includes('"text"'), '文本应保留'),
]);

await runTest('JSX 基础: 空白文本节点', `
import { $state } from 'aether'
const el = <div> </div>
`, [
  // 空白文本可能被忽略
  (out) => assert(out.includes('__createElement("div")'), '应创建 div'),
]);

await runTest('JSX 基础: 自闭合标签', `
import { $state } from 'aether'
const el = <input type="text" />
`, [
  (out) => assert(out.includes('__createElement("input")'), '应创建 input'),
  (out) => assert(out.includes('"text"'), '属性值应保留'),
]);

await runTest('JSX 基础: 多子节点', `
import { $state } from 'aether'
const el = <div><p>1</p><p>2</p><p>3</p></div>
`, [
  (out) => assert(out.includes('__createElement("p")'), '应创建多个 p'),
  (out) => assert(out.includes('appendChild'), '应使用 appendChild'),
]);

// ============================================
// 响应式内容测试
// ============================================

await runTest('响应式: 插值表达式', `
import { $state } from 'aether'
let count = $state(0)
const el = <div>{count}</div>
`, [
  (out) => assert(out.includes('__bindText'), '响应式内容应使用 __bindText'),
  (out) => assert(out.includes('count.value'), 'state 应替换为 .value'),
]);

await runTest('响应式: 多个插值', `
import { $state } from 'aether'
let a = $state(1)
let b = $state(2)
const el = <div>{a} + {b} = {a + b}</div>
`, [
  (out) => assert(out.includes('__bindText'), '响应式内容应使用 __bindText'),
  (out) => assert(out.includes('a.value'), 'a 应替换'),
  (out) => assert(out.includes('b.value'), 'b 应替换'),
]);

await runTest('响应式: 插值在属性中', `
import { $state } from 'aether'
let cls = $state("active")
const el = <div class={cls}>content</div>
`, [
  (out) => assert(out.includes('__bindAttr'), '响应式属性应使用 __bindAttr'),
  (out) => assert(out.includes('cls.value'), 'cls 应替换'),
]);

await runTest('响应式: 模板字符串', `
import { $state } from 'aether'
let name = $state("World")
const el = <div>Hello, {name}!</div>
`, [
  (out) => assert(out.includes('__bindText'), '应使用 __bindText'),
  (out) => assert(out.includes('name.value'), 'name 应替换'),
]);

// ============================================
// 属性测试
// ============================================

await runTest('属性: 静态字符串', `
import { $state } from 'aether'
const el = <div id="app" data-msg="hello">content</div>
`, [
  (out) => assert(out.includes('__setAttr'), '静态属性应使用 __setAttr'),
  (out) => assert(out.includes('"app"'), 'id 属性'),
  (out) => assert(out.includes('"hello"'), 'data 属性'),
]);

await runTest('属性: 布尔属性', `
import { $state } from 'aether'
const el = <input disabled />
`, [
  (out) => assert(out.includes('__setAttr'), '布尔属性应使用 __setAttr'),
  (out) => assert(out.includes('true'), '布尔值为 true'),
]);

await runTest('属性: 动态布尔属性', `
import { $state } from 'aether'
let disabled = $state(false)
const el = <input disabled={disabled} />
`, [
  (out) => assert(out.includes('__bindAttr'), '动态布尔属性应使用 __bindAttr'),
]);

await runTest('属性: onClick 事件', `
import { $state } from 'aether'
function handleClick() { console.log("clicked") }
const el = <button onClick={handleClick}>Click</button>
`, [
  (out) => assert(out.includes('__setAttr'), '事件处理器应使用 __setAttr'),
  (out) => assert(out.includes('"onClick"'), 'onClick 属性'),
]);

await runTest('属性: 多个事件类型', `
import { $state } from 'aether'
function onClick() {}
function onChange() {}
function onSubmit() {}
const el = <form onSubmit={onSubmit}><input onChange={onChange} /><button onClick={onClick}>OK</button></form>
`, [
  (out) => assert(out.includes('"onSubmit"'), 'onSubmit'),
  (out) => assert(out.includes('"onChange"'), 'onChange'),
  (out) => assert(out.includes('"onClick"'), 'onClick'),
]);

await runTest('属性: className 别名', `
import { $state } from 'aether'
let cls = $state("test")
const el = <div className={cls}>content</div>
`, [
  (out) => assert(out.includes('__bindAttr'), '动态 className 应使用 __bindAttr'),
]);

await runTest('属性: class 和 className 混用', `
import { $state } from 'aether'
let active = $state(true)
const el = <div class="base" className={active ? "active" : ""}>content</div>
`, [
  (out) => assert(out.includes('__setAttr'), '静态 class 使用 __setAttr'),
  (out) => assert(out.includes('__bindAttr'), '动态 className 使用 __bindAttr'),
]);

await runTest('属性: style 对象', `
import { $state } from 'aether'
let color = $state("red")
const el = <div style={{ color: color, fontSize: "14px" }}>text</div>
`, [
  (out) => assert(out.includes('__setAttr'), 'style 应使用 __setAttr'),
  (out) => assert(out.includes('color.value'), '动态 style 值应替换'),
]);

await runTest('属性: data-* 属性', `
import { $state } from 'aether'
let id = $state(123)
const el = <div data-id={id} data-active="true">content</div>
`, [
  (out) => assert(out.includes('__bindAttr'), '动态 data 属性'),
  (out) => assert(out.includes('__setAttr'), '静态 data 属性'),
]);

// ============================================
// 条件渲染测试
// ============================================

await runTest('条件: 三元表达式', `
import { $state } from 'aether'
let show = $state(true)
const el = <div>{show ? <span>shown</span> : null}</div>
`, [
  (out) => assert(out.includes('__createElement'), '条件渲染应创建元素'),
  (out) => assert(out.includes('__bindText'), 'span 内容'),
]);

await runTest('条件: && 运算符', `
import { $state } from 'aether'
let items = $state([1, 2, 3])
const el = <div>{items.length > 0 && <ul>list</ul>}</div>
`, [
  (out) => assert(out.includes('__createElement'), '&& 条件应创建元素'),
]);

await runTest('条件: 逻辑表达式', `
import { $state } from 'aether'
let a = $state(true)
let b = $state(false)
const el = <div>{a && b && <span>both</span>}</div>
`, [
  (out) => assert(out.includes('__createElement'), '逻辑与应创建元素'),
]);

// ============================================
// 列表渲染测试
// ============================================

await runTest('列表: map 渲染', `
import { $state } from 'aether'
let items = $state(["a", "b", "c"])
const el = <ul>{items.map(item => <li>{item}</li>)}</ul>
`, [
  (out) => assert(out.includes('__createElement'), 'map 应创建元素'),
  (out) => assert(out.includes('__bindText'), '列表内容'),
]);

await runTest('列表: 嵌套列表', `
import { $state } from 'aether'
let matrix = $state([[1, 2], [3, 4]])
const el = <div>{matrix.map(row => <div>{row.map(cell => <span>{cell}</span>)}</div>)}</div>
`, [
  (out) => assert(out.includes('__createElement'), '嵌套 map 应创建元素'),
  (out) => assert(out.includes('__bindText'), '内容绑定'),
]);

// ============================================
// 组件测试
// ============================================

await runTest('组件: 大写开头组件', `
import { $state } from 'aether'
function App() { return <div>app</div> }
const el = <App />
`, [
  (out) => assert(out.includes('__createComponent'), '大写开头组件使用 __createComponent'),
]);

await runTest('组件: 传递 props', `
import { $state } from 'aether'
function Button(props) { return <button>{props.label}</button> }
const el = <Button label="Click" />
`, [
  (out) => assert(out.includes('__createComponent'), '组件使用 __createComponent'),
  (out) => assert(out.includes('"Click"'), 'props 值应保留'),
]);

await runTest('组件: 响应式 props', `
import { $state } from 'aether'
let label = $state("Click")
function Button(props) { return <button>{props.label}</button> }
const el = <Button label={label} />
`, [
  (out) => assert(out.includes('__createComponent'), '组件使用 __createComponent'),
  (out) => assert(out.includes('label.value'), '响应式 props 应替换'),
]);

await runTest('组件: 组件嵌套', `
import { $state } from 'aether'
function Header() { return <div>header</div> }
function Body() { return <div>body</div> }
function App() { return <div><Header /><Body /></div> }
const el = <App />
`, [
  (out) => assert(out.includes('__createComponent'), '嵌套组件使用 __createComponent'),
]);

await runTest('组件: 成员表达式组件', `
import { $state } from 'aether'
const Components = { Button: (props) => <button>{props.label}</button> }
const el = <Components.Button label="test" />
`, [
  (out) => assert(out.includes('__createComponent'), '成员表达式组件'),
]);

await runTest('组件: children', `
import { $state } from 'aether'
function Card(props) { return <div>{props.children}</div> }
const el = <Card><span>content</span></Card>
`, [
  (out) => assert(out.includes('__createComponent'), '带 children 的组件'),
  (out) => assert(out.includes('children'), 'children 属性'),
]);

// ============================================
// Fragment 测试
// ============================================

await runTest('Fragment: <> </>', `
import { $state } from 'aether'
const el = <><div>a</div><div>b</div></>
`, [
  (out) => assert(out.includes('createDocumentFragment'), 'Fragment 使用 createDocumentFragment'),
]);

await runTest('Fragment: 空 Fragment', `
import { $state } from 'aether'
const el = <></>
`, [
  (out) => assert(out.includes('createDocumentFragment'), '空 Fragment'),
]);

await runTest('Fragment: 嵌套', `
import { $state } from 'aether'
const el = <><><div>inner</div></></>
`, [
  (out) => assert(out.includes('createDocumentFragment'), '嵌套 Fragment'),
]);

// ============================================
// Spread 属性测试
// ============================================

await runTest('Spread: {...props}', `
import { $state } from 'aether'
let props = $state({ id: 1, class: "test" })
const el = <div {...props} />
`, [
  (out) => assert(out.includes('__setAttr'), 'spread 属性'),
  (out) => assert(out.includes('Object.keys'), '使用 Object.keys 展开'),
]);

await runTest('Spread: 混合', `
import { $state } from 'aether'
let extra = $state({ id: 1 })
const el = <div class="base" {...extra} data-active="true" />
`, [
  (out) => assert(out.includes('__setAttr'), '混合属性'),
  (out) => assert(out.includes('Object.keys'), 'spread 展开'),
]);

await runTest('Spread: 响应式 spread', `
import { $state } from 'aether'
let dynamic = $state({ style: "color:red" })
const el = <div {...dynamic} />
`, [
  (out) => assert(out.includes('Object.keys'), '响应式 spread'),
]);

// ============================================
// 复杂表达式测试
// ============================================

await runTest('表达式: 二元运算', `
import { $state } from 'aether'
let a = $state(5)
let b = $state(3)
const el = <div>{a + b}</div>
`, [
  (out) => assert(out.includes('a.value + b.value'), '二元运算应替换'),
]);

await runTest('表达式: 函数调用', `
import { $state } from 'aether'
let name = $state("world")
function greet(n) { return "Hello, " + n }
const el = <div>{greet(name)}</div>
`, [
  (out) => assert(out.includes('greet(name.value)'), '函数参数应替换'),
]);

await runTest('表达式: 数组方法', `
import { $state } from 'aether'
let items = $state([1, 2, 3])
const sum = $derived(() => items.reduce((a, b) => a + b, 0))
const el = <div>{sum}</div>
`, [
  (out) => assert(out.includes('__bindText'), 'derived 应绑定'),
  (out) => assert(out.includes('sum.value'), 'derived 应替换'),
]);

await runTest('表达式: 对象属性访问', `
import { $state } from 'aether'
let user = $state({ name: "John", age: 30 })
const el = <div>{user.name}</div>
`, [
  (out) => assert(out.includes('__bindText'), '对象属性应绑定'),
  (out) => assert(out.includes('user.name.value'), 'store 属性应替换'),
]);

await runTest('表达式: 数组索引访问', `
import { $state } from 'aether'
let arr = $state([10, 20, 30])
const el = <div>{arr[0]}</div>
`, [
  (out) => assert(out.includes('__bindText'), '数组索引应绑定'),
  (out) => assert(out.includes('arr.value[0]'), '数组索引访问应替换'),
]);

await runTest('表达式: 三元嵌套', `
import { $state } from 'aether'
let a = $state(1)
let b = $state(2)
let c = $state(3)
const el = <div>{a > b ? (a > c ? a : c) : (b > c ? b : c)}</div>
`, [
  (out) => assert(out.includes('__bindText'), '三元应绑定'),
  (out) => assert(out.includes('a.value'), '嵌套三元中的 state 应替换'),
]);

await runTest('表达式: 箭头函数', `
import { $state } from 'aether'
let handler = $state(() => console.log("clicked"))
const el = <button onClick={handler}>Click</button>
`, [
  (out) => assert(out.includes('__setAttr'), '箭头函数 handler'),
]);

await runTest('表达式: 类型转换', `
import { $state } from 'aether'
let num = $state(42)
const el = <div>{String(num)}</div>
`, [
  (out) => assert(out.includes('String(num.value)'), '类型转换函数参数应替换'),
]);

await runTest('表达式: 逻辑运算', `
import { $state } from 'aether'
let a = $state(true)
let b = $state(false)
const el = <div>{a && b || true}</div>
`, [
  (out) => assert(out.includes('__bindText'), '逻辑表达式应绑定'),
  (out) => assert(out.includes('a.value'), '逻辑运算符中的 state 应替换'),
]);

// ============================================
// 静态表达式（不应绑定）
// ============================================

await runTest('静态: 纯数字', `
import { $state } from 'aether'
const el = <div>{123}</div>
`, [
  (out) => assert(out.includes('__createText'), '纯数字使用 __createText'),
  (out) => assert(!out.includes('__bindText'), '纯数字不应使用 __bindText'),
]);

await runTest('静态: 纯字符串', `
import { $state } from 'aether'
const el = <div>{"static string"}</div>
`, [
  (out) => assert(out.includes('__createText'), '纯字符串使用 __createText'),
]);

await runTest('静态: 布尔值', `
import { $state } from 'aether'
const el = <div>{true}{false}</div>
`, [
  (out) => assert(out.includes('__createText'), '布尔值使用 __createText'),
]);

await runTest('静态: 局部变量', `
import { $state } from 'aether'
const localVar = "local"
const el = <div>{localVar}</div>
`, [
  (out) => assert(out.includes('__createText'), '局部变量使用 __createText'),
  (out) => assert(!out.includes('__bindText'), '局部变量不应绑定'),
]);

await runTest('静态: 普通函数调用', `
import { $state } from 'aether'
function getStatic() { return "static" }
const el = <div>{getStatic()}</div>
`, [
  (out) => assert(out.includes('__createText'), '普通函数调用使用 __createText'),
]);

// ============================================
// 命名空间属性测试
// ============================================

await runTest('命名空间: xml:lang', `
import { $state } from 'aether'
const el = <div xml:lang="en">content</div>
`, [
  (out) => assert(out.includes('__setAttr'), '命名空间属性'),
  (out) => assert(out.includes('"xml:lang"'), '命名空间属性名保留'),
]);

// ============================================
// 危险属性测试（安全性）
// ============================================

await runTest('安全: 危险属性名 __proto__', `
import { $state } from 'aether'
let val = $state("test")
const el = <div __proto__={val} />
`, [
  (out) => assert(out.includes('__setAttr'), 'setAttr 应处理危险属性'),
]);

await runTest('安全: 危险属性名 constructor', `
import { $state } from 'aether'
let val = $state("test")
const el = <div constructor={val} />
`, [
  (out) => assert(out.includes('__setAttr'), 'setAttr 应处理危险属性'),
]);

await runTest('安全: 危险属性名 prototype', `
import { $state } from 'aether'
let val = $state("test")
const el = <div prototype={val} />
`, [
  (out) => assert(out.includes('__setAttr'), 'setAttr 应处理危险属性'),
]);

// ============================================
// 完整示例测试
// ============================================

await runTest('完整: 计数器组件', `
import { $state, $derived, $effect } from 'aether'
let count = $state(0)
let doubled = $derived(() => count * 2)
function increment() { count++ }
function decrement() { count-- }
const el = (
  <div class="counter">
    <h1>{count}</h1>
    <p>Doubled: {doubled}</p>
    <button onClick={increment}>+</button>
    <button onClick={decrement}>-</button>
  </div>
)
`, [
  (out) => assert(out.includes('__createElement'), '完整示例应生成所有 createElement'),
  (out) => assert(out.includes('__bindText'), '响应式内容应绑定'),
  (out) => assert(out.includes('__bindAttr'), '响应式属性应绑定'),
  (out) => assert(out.includes('__setAttr'), '事件处理器'),
  (out) => assert(out.includes('count.value'), 'count 应替换'),
  (out) => assert(out.includes('doubled.value'), 'doubled 应替换'),
]);

await runTest('完整: Todo 列表', `
import { $state } from 'aether'
let todos = $state([])
let newTodo = $state("")
function addTodo() {
  if (newTodo) {
    todos.push({ id: Date.now(), text: newTodo })
    newTodo = ""
  }
}
const el = (
  <div class="todo-app">
    <ul>
      {todos.map(todo => (
        <li key={todo.id}>{todo.text}</li>
      ))}
    </ul>
    <input value={newTodo} onChange={(e) => { newTodo = e.target.value }} />
    <button onClick={addTodo}>Add</button>
  </div>
)
`, [
  (out) => assert(out.includes('__createElement'), 'Todo 列表应生成元素'),
  (out) => assert(out.includes('__bindAttr'), '响应式属性应绑定'),
  (out) => assert(out.includes('__setAttr'), '事件应设置'),
]);

await runTest('完整: 登录表单', `
import { $state } from 'aether'
let username = $state("")
let password = $state("")
let errors = $state({})
function validate() {
  const errs = {}
  if (!username) errs.username = "Required"
  if (!password) errs.password = "Required"
  errors = errs
}
function handleSubmit(e) {
  validate()
  if (Object.keys(errors).length === 0) {
    console.log("Submit:", username, password)
  }
}
const el = (
  <form onSubmit={handleSubmit}>
    <div>
      <input
        type="text"
        value={username}
        placeholder="Username"
        onChange={(e) => { username = e.target.value }}
      />
      {errors.username && <span class="error">{errors.username}</span>}
    </div>
    <div>
      <input
        type="password"
        value={password}
        placeholder="Password"
        onChange={(e) => { password = e.target.value }}
      />
      {errors.password && <span class="error">{errors.password}</span>}
    </div>
    <button type="submit">Login</button>
  </form>
)
`, [
  (out) => assert(out.includes('__createElement'), '表单应生成元素'),
  (out) => assert(out.includes('__bindAttr'), 'value 绑定'),
  (out) => assert(out.includes('__setAttr'), '事件处理'),
]);

// ============================================
// 结果汇总
// ============================================

console.log(`\n=============================`);
console.log(`JSX Advanced Tests: ${passed} passed, ${failed} failed`);

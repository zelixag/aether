# 计数器示例

本示例展示 Aether 框架的所有核心功能。

## 完整代码

文件: `examples/counter/src/main.jsx`

```jsx
// Aether 完整示例
// 展示所有内置功能：$state, $derived, $effect, $store, $async, $style
// 用户写的代码——干净、直观、无 .value、无 Hooks 规则
import { $state, $derived, $effect, $store, $async, $style, mount } from 'aether'

// ============================================
// $store: 跨组件共享状态——无需 Context、无需 Provider
// ============================================
const appStore = $store({
  theme: 'dark',
  user: 'Aether'
})

// ============================================
// Counter 组件
// ============================================
function Counter() {
  let count = $state(0)
  let double = $derived(() => count * 2)

  // $effect: 自动副作用，组件卸载自动清理
  $effect(() => {
    document.title = `Aether | Count: ${count}`
  })

  // $style: 编译时作用域 CSS，不污染全局
  const s = $style`
    .counter { text-align: center; padding: 2rem; }
    .count { font-size: 4rem; font-weight: 200; margin: 1rem 0; }
    .derived { color: #888; font-size: 1.2rem; }
    .buttons { display: flex; gap: 1rem; justify-content: center; margin: 1.5rem 0; }
    .btn { padding: 0.5rem 1.5rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; background: transparent; color: #fff; font-size: 1.1rem; cursor: pointer; transition: all 0.2s; }
    .tagline { color: #555; font-size: 0.9rem; margin-top: 2rem; }
  `

  return (
    <div class="counter">
      <h1>Aether Counter</h1>
      <p class="count">{count}</p>
      <p class="derived">Double: {double}</p>
      <div class="buttons">
        <button class="btn" onClick={() => count--}>-</button>
        <button class="btn" onClick={() => count = 0}>Reset</button>
        <button class="btn" onClick={() => count++}>+</button>
      </div>
      <p class="derived">Theme: {appStore.theme} | User: {appStore.user}</p>
      <p class="tagline">Compiled. Reactive. Minimal.</p>
    </div>
  )
}

mount(Counter, '#app')
```

## 运行示例

```bash
cd examples/counter
npm install
npm run dev
```

运行 `npm run example:counter` 启动开发服务器查看效果。

## 功能分解

### $state - 响应式状态

```jsx
let count = $state(0)
```

- 声明一个初始值为 0 的响应式状态
- 编译后转换为 `const count = __signal(0)`
- 读取和赋值自动添加 `.value`

### $derived - 派生计算

```jsx
let double = $derived(() => count * 2)
```

- 基于 `count` 自动计算双倍值
- 只有当 `count` 变化时才重新计算
- 惰性求值：只有读取时才计算

### $effect - 副作用

```jsx
$effect(() => {
  document.title = `Aether | Count: ${count}`
})
```

- 当 `count` 变化时自动更新文档标题
- 无需手动依赖声明
- 组件卸载时自动清理

### $store - 全局状态

```jsx
const appStore = $store({
  theme: 'dark',
  user: 'Aether'
})
```

- 在组件外部声明，跨组件共享
- 每个属性是独立的 Signal
- 直接使用 `appStore.theme` 读取/赋值

### $style - 作用域样式

```jsx
const s = $style`
  .counter { text-align: center; padding: 2rem; }
  .count { font-size: 4rem; font-weight: 200; margin: 1rem 0; }
`
```

- 编译时自动添加唯一 hash
- CSS 类名变为 `.counter[data-aether-scope="xxx"]`
- 不会污染全局样式

### mount - 挂载组件

```jsx
mount(Counter, '#app')
```

- 将 Counter 组件渲染到 `#app` 容器
- 返回 `{ unmount }` 用于清理

## 编译后等价代码

```js
// 编译后（简化展示）
import { __signal, __derived, __effect, __store, __async, __injectStyle, mount } from 'aether'

// $store 编译后
const appStore = __store({
  theme: 'dark',
  user: 'Aether'
})

// Counter 组件
function Counter() {
  // $state 编译后
  const count = __signal(0)

  // $derived 编译后
  const double = __derived(() => count.value * 2)

  // $effect 编译后
  __effect(() => {
    document.title = `Aether | Count: ${count.value}`
  })

  // $style 编译后
  const s = __injectStyle('.counter { ... }', 'counter-abc123')

  // JSX 编译后（简化）
  return /* ... */
}

mount(Counter, '#app')
```

## 效果演示

1. **点击 +/- 按钮**: `count` 变化，UI 自动更新
2. **点击 Reset**: `count` 重置为 0
3. **观察 Double**: 显示 `count * 2`，跟随 `count` 变化
4. **观察标题**: 浏览器标签页标题显示当前计数值
5. **Store 数据**: 显示全局的 theme 和 user（可在其他组件中修改）

## 项目结构

```
examples/counter/
├── package.json
├── vite.config.js       # Vite 配置，引入 aether-compiler
├── index.html           # HTML 入口
└── src/
    └── main.jsx         # 主组件
```

## package.json

```json
{
  "name": "aether-example-counter",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build"
  },
  "dependencies": {
    "aether": "file:../../packages/runtime",
    "aether-compiler": "file:../../packages/compiler"
  },
  "devDependencies": {
    "vite": "^5.4.0",
    "@babel/core": "^7.24.0",
    "@babel/plugin-syntax-jsx": "^7.24.0"
  }
}
```

## vite.config.js

```js
import { defineConfig } from 'vite'
import { aetherVitePlugin } from 'aether-compiler'

export default defineConfig({
  plugins: [aetherVitePlugin()],
})
```

关键配置：
- 引入 `aetherVitePlugin()` 用于编译时宏转换
- 无需额外配置，Aether 自动处理 JSX 和宏

## 下一步

- 查看 [快速入门](../guide/getting-started.md) 搭建新项目
- 查看 [核心概念](../guide/concepts.md) 深入了解响应式原理
- 查看 [API 文档](../api/$state.md) 了解更多 API

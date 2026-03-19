# 快速入门

本指南将帮助你搭建第一个 Aether 项目。

## 环境要求

- Node.js >= 16.0
- 支持 ES Module 的构建工具 (Vite, Rollup 等)

## 安装

Aether 由两个包组成：

- `aether`: 运行时核心
- `aether-compiler`: 编译时宏转换

```bash
npm install aether aether-compiler
```

## 项目结构

创建一个最小化的 Aether 项目：

```
my-app/
├── package.json
├── vite.config.js
├── index.html
└── src/
    └── main.jsx
```

## 配置 Vite

创建 `vite.config.js`:

```js
import { defineConfig } from 'vite'
import { aetherVitePlugin } from 'aether-compiler'

export default defineConfig({
  plugins: [aetherVitePlugin()],
})
```

## 创建入口文件

创建 `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Aether App</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

## 编写第一个组件

创建 `src/main.jsx`:

```jsx
import { $state, $derived, $effect, $style, mount } from 'aether'

function Counter() {
  // 声明响应式状态
  let count = $state(0)

  // 声明派生计算值（自动追踪 count 变化）
  let double = $derived(() => count * 2)

  // 声明副作用（自动追踪 count 变化）
  $effect(() => {
    document.title = `Count: ${count}`
  })

  // 声明作用域样式（编译时自动添加 hash）
  const s = $style`
    .counter {
      text-align: center;
      padding: 2rem;
      font-family: system-ui, sans-serif;
    }
    .count {
      font-size: 4rem;
      font-weight: 200;
      margin: 1rem 0;
    }
    .buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }
    .btn {
      padding: 0.5rem 1.5rem;
      border: 1px solid #ccc;
      border-radius: 8px;
      background: transparent;
      font-size: 1.1rem;
      cursor: pointer;
    }
    .btn:hover {
      background: #f5f5f5;
    }
  `

  return (
    <div class="counter">
      <h1>Aether Counter</h1>
      <p class="count">{count}</p>
      <p>Double: {double}</p>
      <div class="buttons">
        <button class="btn" onClick={() => count--}>-</button>
        <button class="btn" onClick={() => count = 0}>Reset</button>
        <button class="btn" onClick={() => count++}>+</button>
      </div>
    </div>
  )
}

// 挂载到 DOM
mount(Counter, '#app')
```

## 运行开发服务器

```bash
npm install vite
npx vite
```

访问 http://localhost:5173（Vite 默认端口），你应该能看到一个功能完整的计数器。

## 编译后代码

Aether 的编译时宏转换会将上述代码转换为：

```js
// 编译后（简化展示）
import { __signal, __derived, __effect, __injectStyle, mount } from 'aether'

function Counter() {
  const count = __signal(0)
  const double = __derived(() => count.value * 2)

  __effect(() => {
    document.title = `Count: ${count.value}`
  })

  const s = __injectStyle('.counter { ... }', 'counter-abc123')

  return (
    <div class={`counter ${s.scope}`}>
      {/* ... */}
    </div>
  )
}

mount(Counter, '#app')
```

但这一切都是自动完成的，你只需编写原始的简洁语法。

## 下一步

- 查看 [核心概念](./concepts.md) 了解 Aether 的响应式原理
- 查看 [API 文档](../api/$state.md) 深入了解各 API
- 查看 [计数器示例](../examples/counter.md) 完整示例

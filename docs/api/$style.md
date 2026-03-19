# $style API

声明作用域样式。

## 语法

```typescript
$style(strings: TemplateStringsArray, ...values: any[]): {
  scope: string;
}
```

## 参数

| 参数 | 类型 | 描述 |
|------|------|------|
| `strings` | `TemplateStringsArray` | CSS 模板字符串 |
| `values` | `any[]` | 插值值（可选） |

## 返回值

返回一个对象，包含 `scope` 属性（用于添加作用域 hash）。

## 说明

`$style` 用于声明组件作用域样式，编译时自动：

1. **生成唯一 hash**: 每个组件的样式都有独立的作用域标识
2. **注入 CSS**: 将作用域化的 CSS 注入到页面
3. **返回 scope**: 返回作用域标识符用于组件

## 用法示例

### 基本使用

```jsx
import { $style, mount } from 'aether'

function Button() {
  const s = $style`
    .button {
      padding: 0.5rem 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
      background: #fff;
    }
    .button:hover {
      background: #f5f5f5;
    }
  `

  return (
    <button class={`button ${s.scope}`}>
      Click me
    </button>
  )
}

mount(Button, '#app')
```

### 完整示例

```jsx
import { $style, mount } from 'aether'

function Card() {
  const s = $style`
    .card {
      border: 1px solid #ddd;
      border-radius: 8px;
      padding: 1.5rem;
      max-width: 300px;
    }
    .title {
      font-size: 1.25rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .content {
      color: #666;
      line-height: 1.5;
    }
  `

  return (
    <div class={`card ${s.scope}`}>
      <h2 class={`title ${s.scope}`}>Card Title</h2>
      <p class={`content ${s.scope}`}>
        This is some card content.
      </p>
    </div>
  )
}
```

### 动态值插值

```jsx
function ThemeCard({ primaryColor = '#007bff' }) {
  const s = $style`
    .card {
      padding: 1rem;
      border: 2px solid ${primaryColor};
      border-radius: 8px;
    }
    .title {
      color: ${primaryColor};
      font-size: 1.5rem;
    }
  `

  return (
    <div class={`card ${s.scope}`}>
      <h1 class={`title ${s.scope}`}>Themed Card</h1>
    </div>
  )
}
```

### 多组件样式隔离

```jsx
import { $style, mount } from 'aether'

// Component A
function ComponentA() {
  const s = $style`
    .wrapper { background: red; }
  `

  return <div class={`wrapper ${s.scope}`}>A</div>
}

// Component B
function ComponentB() {
  const s = $style`
    .wrapper { background: blue; }
  `

  return <div class={`wrapper ${s.scope}`}>B</div>
}

// 两个组件的 .wrapper 样式互不影响
mount(ComponentA, '#a')
mount(ComponentB, '#b')
```

### 条件类名

```jsx
function ToggleButton({ isActive }) {
  const s = $style`
    .btn {
      padding: 0.5rem 1rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .active {
      background: green;
      color: white;
    }
    .inactive {
      background: gray;
      color: #333;
    }
  `

  return (
    <button class={`btn ${isActive ? `active ${s.scope}` : `inactive ${s.scope}`}`}>
      {isActive ? 'Active' : 'Inactive'}
    </button>
  )
}
```

### 响应式样式

```jsx
function ResponsiveGrid() {
  const s = $style`
    .grid {
      display: grid;
      gap: 1rem;
      padding: 1rem;
    }
    @media (min-width: 600px) {
      .grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (min-width: 900px) {
      .grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    .item {
      background: #f5f5f5;
      padding: 1rem;
    }
  `

  return (
    <div class={`grid ${s.scope}`}>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} class={`item ${s.scope}`}>Item {i}</div>
      ))}
    </div>
  )
}
```

### 伪类和伪元素

```jsx
function FancyInput() {
  const s = $style`
    .input-wrapper {
      position: relative;
      margin: 1rem;
    }
    .input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .input:focus {
      outline: none;
      border-color: blue;
      box-shadow: 0 0 0 2px rgba(0, 0, 255, 0.2);
    }
    .label {
      display: block;
      margin-bottom: 0.25rem;
      color: #666;
    }
    .input-wrapper::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 2px;
      background: blue;
      transition: width 0.2s;
    }
    .input-wrapper:focus-within::after {
      width: 100%;
    }
  `

  return (
    <div class={`input-wrapper ${s.scope}`}>
      <label class={`label ${s.scope}`}>Email</label>
      <input class={`input ${s.scope}`} type="email" />
    </div>
  )
}
```

## 工作原理

### 编译时转换

```jsx
// 用户编写的代码
const s = $style`
  .button { color: red; }
`
```

编译后：

```js
// 生成的代码
const s = __injectStyle('.button { color: red; }', 'button-abc123')
// s.scope = 'button-abc123'
```

### 样式注入

`__injectStyle` 函数会将 CSS 添加到文档的 `<style>` 标签中，并添加数据属性选择器：

```js
// 注入的 CSS
.button[data-aether-scope="button-abc123"] {
  color: red;
}

// 组件中使用
<button class="button button-abc123">Click</button>
```

## 与 CSS Modules 的对比

| 特性 | $style | CSS Modules |
|------|--------|------------|
| 语法 | 模板字符串 | `.module.css` 文件 |
| 动态值 | 支持插值 | 需要 :global() |
| 作用域方式 | hash 属性 | hash 类名 |
| 构建工具 | 内置 | 需要配置 |
| 零配置 | 是 | 否 |

## 与普通 CSS 的对比

```jsx
// 普通 CSS（污染全局）
const s = $style`
  .button { color: red; }  // 可能与其他地方的 .button 冲突
`

// $style 作用域化
const s = $style`
  .button[data-aether-scope="xxx"] { color: red; }  // 安全
`
```

## 底层实现

```js
const styleCache = new Map()

export function __injectStyle(css, scopeId) {
  if (styleCache.has(scopeId)) {
    return { scope: scopeId }
  }

  // 将选择器添加 scope 属性
  const scopedCss = css.replace(
    /([^\r\n,{}]+)(,(?=[^}]*{)|s*{)/g,
    (match, selector, suffix) => {
      if (selector.trim().startsWith('@')) {
        return selector + suffix
      }
      const scopedSelector = selector
        .split(',')
        .map(s => s.trim() + `[data-aether-scope="${scopeId}"]`)
        .join(',')
      return scopedSelector + suffix
    }
  )

  const style = document.createElement('style')
  style.textContent = scopedCss
  document.head.appendChild(style)

  styleCache.set(scopeId, style)
  return { scope: scopeId }
}
```

## 样式清理

当组件卸载时，作用域样式不会被自动移除（因为可能其他组件也在使用相同的 CSS 定义）。如果需要完全控制样式生命周期，可以手动管理。

## 注意事项

1. **插值值需要谨慎使用**
   ```jsx
   // 动态值可能导致样式无法正确作用域化
   const color = '#ff0000'
   const s = $style`
     .text { color: ${color}; }  // OK
   `

   // 复杂表达式可能有问题
   const s = $style`
     .${dynamicClass} { color: red; }  // 不推荐
   `
   ```

2. **@media 和 @keyframes 需要特殊处理**
   ```jsx
   // 推荐：确保规则在选择器内
   const s = $style`
     .container {
       @media (min-width: 600px) {
         .item { flex-direction: row; }
       }
     }
   `
   ```

3. **避免选择器冲突**
   ```jsx
   // 不好：没有作用域
   const s = $style`
     * { box-sizing: border-box; }
   `

   // 好：使用作用域
   const s = $style`
     .${s.scope} * { box-sizing: border-box; }
   `
   ```

## 相关 API

- [$state](./$state.md) - 响应式状态
- [$derived](./$derived.md) - 派生计算值
- [$effect](./$effect.md) - 副作用
- [mount](./mount.md) - 挂载组件

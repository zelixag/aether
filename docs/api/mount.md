# mount API

将组件挂载到 DOM。

## 语法

```typescript
mount(
  component: (props?: any) => Node,
  container: string | Element
): { unmount: () => void }
```

## 参数

| 参数 | 类型 | 描述 |
|------|------|------|
| `component` | `(props?: any) => Node` | 组件函数，返回 DOM 节点 |
| `container` | `string \| Element` | 目标容器（CSS 选择器或 DOM 元素） |

## 返回值

返回一个对象，包含 `unmount` 方法用于卸载组件。

## 说明

`mount` 是 Aether 应用的入口点，用于：

1. 将组件渲染到指定容器
2. 清空容器原有内容
3. 设置组件上下文
4. 返回卸载函数用于清理

## 用法示例

### 基本使用

```jsx
import { $state, $style, mount } from 'aether'

function App() {
  let count = $state(0)

  const s = $style`
    .app { text-align: center; padding: 2rem; }
    .count { font-size: 2rem; margin: 1rem; }
    .btn { padding: 0.5rem 1rem; margin: 0 0.25rem; }
  `

  return (
    <div class={`app ${s.scope}`}>
      <h1>My App</h1>
      <p class={`count ${s.scope}`}>{count}</p>
      <button class={`btn ${s.scope}`} onClick={() => count++}>
        Increment
      </button>
    </div>
  )
}

// 挂载到 #app 元素
mount(App, '#app')
```

### 使用 Element 作为容器

```jsx
const container = document.getElementById('app')
mount(App, container)
```

### 处理卸载

```jsx
const { unmount } = mount(App, '#app')

// 稍后卸载组件
setTimeout(() => {
  unmount()
  console.log('App unmounted')
}, 5000)
```

### 有条件地挂载

```jsx
function ConditionalMount() {
  let shouldMount = $state(true)

  const handleMount = () => {
    const { unmount } = mount(App, '#app')
    window.appUnmount = unmount
  }

  return (
    <div>
      <button onClick={handleMount}>Mount App</button>
      <button onClick={() => window.appUnmount?.()}>
        Unmount App
      </button>
    </div>
  )
}
```

### 带 props 的组件

```jsx
function UserCard({ name, email }) {
  const s = $style`
    .card { border: 1px solid #ccc; padding: 1rem; }
    .name { font-weight: bold; }
  `

  return (
    <div class={`card ${s.scope}`}>
      <p class={`name ${s.scope}`}>{name}</p>
      <p>{email}</p>
    </div>
  )
}

// 传递 props
mount(() => UserCard({ name: 'Aether', email: 'aether@example.com' }), '#app')
```

### 多个组件

```jsx
import { mount } from 'aether'
import Header from './components/Header'
import Sidebar from './components/Sidebar'
import MainContent from './components/MainContent'

function Layout() {
  const s = $style`
    .layout { display: flex; }
    .sidebar { width: 250px; }
    .main { flex: 1; }
  `

  return (
    <div class={`layout ${s.scope}`}>
      <div class={`sidebar ${s.scope}`}>
        <Sidebar />
      </div>
      <div class={`main ${s.scope}`}>
        <MainContent />
      </div>
    </div>
  )
}

mount(Header, '#header')
mount(Layout, '#main')
```

### HMR (热模块替换)

```jsx
// 在开发环境中支持 HMR
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    unmount()
  })
}
```

## 组件函数签名

组件函数接收可选的 props 对象：

```typescript
interface User {
  id: number
  name: string
  email: string
}

function UserCard(props: { user: User }) {
  return (
    <div>
      <h2>{props.user.name}</h2>
      <p>{props.user.email}</p>
    </div>
  )
}

// 挂载时传递 props
mount(() => UserCard({ user: { id: 1, name: 'Aether', email: 'test@example.com' } }), '#app')
```

## 卸载行为

调用 `unmount()` 时：

1. 执行所有组件内创建的 effect 的清理函数
2. 移除组件的 DOM 节点
3. 清空容器内容

```jsx
function ComponentWithCleanup() {
  $effect(() => {
    const timer = setInterval(() => {
      console.log('tick')
    }, 1000)

    return () => clearInterval(timer)
  })

  return <div>Timer Component</div>
}

const { unmount } = mount(ComponentWithCleanup, '#app')

// 卸载时：
// 1. clearInterval 被调用
// 2. DOM 节点被移除
// 3. #app 被清空
unmount()
```

## 与 React 的对比

| 特性 | Aether mount | ReactDOM.render |
|------|--------------|-----------------|
| 返回值 | `{ unmount }` | `{ render }` |
| 容器清空 | 自动 | 需要手动处理 |
| 清理函数 | 自动调用 | 需 useEffect cleanup |

## 底层实现

```js
export function mount(componentFn, container) {
  if (typeof container === 'string') {
    container = document.querySelector(container)
  }
  container.innerHTML = ''  // 清空容器

  const ctx = new ComponentContext()
  currentComponent = ctx
  const nodes = componentFn()
  const nodeArr = Array.isArray(nodes) ? nodes : [nodes]

  for (const node of nodeArr) {
    container.appendChild(node)
  }
  currentComponent = null

  return {
    unmount() {
      ctx.dispose()
      container.innerHTML = ''
    }
  }
}
```

## 注意事项

1. **容器选择器只执行一次**
   ```jsx
   // container 是字符串时，只在 mount 时查询一次
   mount(App, '#app')

   // 如果需要动态容器，使用元素引用
   mount(App, document.getElementById('app'))
   ```

2. **多次 mount 到同一容器会清空之前的内容**
   ```jsx
   mount(App1, '#app')
   mount(App2, '#app')  // App1 被卸载，#app 现在是 App2
   ```

3. **unmount 后容器为空**
   ```jsx
   const { unmount } = mount(App, '#app')
   unmount()
   // #app.innerHTML === ''
   ```

## 相关 API

- [$state](./$state.md) - 响应式状态
- [$effect](./$effect.md) - 副作用
- [$style](./$style.md) - 作用域样式

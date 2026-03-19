# $store API

声明全局跨组件状态。

## 语法

```typescript
$store<T extends Record<string, any>>(initialState: T): T
```

## 参数

| 参数 | 类型 | 描述 |
|------|------|------|
| `initialState` | `T` | 初始状态对象 |

## 返回值

返回一个代理对象，每个属性都是独立的响应式 Signal。

## 说明

`$store` 用于创建跨组件共享的全局状态。与 `$state` 不同：

1. **全局作用域**: store 在组件外部声明，所有组件都可以访问
2. **细粒度更新**: 每个属性是独立的 Signal，修改一个属性不会影响其他属性
3. **无需 Provider**: 不需要 React 的 Context 或 Vue 的 provide/inject
4. **Proxy 实现**: 使用 JavaScript Proxy 自动处理属性访问和赋值

## 类型推导

```typescript
const store = $store({
  count: 0,          // count 类型为 number
  name: 'Aether',    // name 类型为 string
  user: null         // user 类型为 null
})

// user 属性后续可以赋值为任意类型
store.user = { name: 'New User', age: 25 }
```

## 用法示例

### 基本使用

```jsx
import { $store, $effect, mount } from 'aether'

// 在组件外部声明 store
const appStore = $store({
  theme: 'dark',
  user: 'Aether'
})

function ThemeToggle() {
  return (
    <div>
      <p>Current theme: {appStore.theme}</p>
      <button onClick={() => appStore.theme = appStore.theme === 'dark' ? 'light' : 'dark'}>
        Toggle Theme
      </button>
    </div>
  )
}

function UserDisplay() {
  return (
    <div>
      <p>User: {appStore.user}</p>
    </div>
  )
}

// 两个组件共享同一个 store
mount(ThemeToggle, '#theme')
mount(UserDisplay, '#user')
```

### 细粒度更新

```jsx
const cartStore = $store({
  items: [],
  total: 0,
  discount: 0
})

function Cart() {
  let items = $state([...])  // 本地状态

  $effect(() => {
    // cartStore.items 变化会自动触发
    cartStore.total = cartStore.items.reduce((sum, item) => sum + item.price, 0)
  })

  return (
    <div>
      <p>Total: {cartStore.total}</p>
      <p>Discount: {cartStore.discount}</p>
    </div>
  )
}
```

### 在 effect 中使用

```jsx
const settingsStore = $store({
  language: 'en',
  notifications: true,
  autoSave: false
})

function Settings() {
  $effect(() => {
    // 保存设置到 localStorage
    localStorage.setItem('settings', JSON.stringify({
      language: settingsStore.language,
      notifications: settingsStore.notifications,
      autoSave: settingsStore.autoSave
    }))
  })

  return (
    <div>
      <select value={settingsStore.language}>
        <option value="en">English</option>
        <option value="zh">中文</option>
      </select>
      <label>
        <input
          type="checkbox"
          checked={settingsStore.notifications}
          onChange={e => settingsStore.notifications = e.target.checked}
        />
        Enable Notifications
      </label>
    </div>
  )
}
```

### 初始化复杂对象

```jsx
const dataStore = $store({
  users: [],
  posts: [],
  comments: [],
  loading: false,
  error: null
})

async function fetchData() {
  dataStore.loading = true
  dataStore.error = null

  try {
    const [users, posts] = await Promise.all([
      fetch('/api/users').then(r => r.json()),
      fetch('/api/posts').then(r => r.json())
    ])

    dataStore.users = users
    dataStore.posts = posts
  } catch (e) {
    dataStore.error = e.message
  } finally {
    dataStore.loading = false
  }
}
```

### Store 更新后重新获取

```jsx
const apiStore = $store({
  endpoint: '/api/users',
  page: 1,
  pageSize: 10,
  data: [],
  total: 0
})

function UserList() {
  let fetching = $state(false)

  $effect(() => {
    // 当 endpoint、page 或 pageSize 变化时，重新获取数据
    fetching = true
    fetch(`${apiStore.endpoint}?page=${apiStore.page}&size=${apiStore.pageSize}`)
      .then(r => r.json())
      .then(result => {
        apiStore.data = result.data
        apiStore.total = result.total
      })
      .finally(() => fetching = false)
  })

  return (
    <div>
      {fetching && <p>Loading...</p>}
      {apiStore.data.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
      <button onClick={() => apiStore.page++}>Next Page</button>
    </div>
  )
}
```

## 与 $state 的区别

| 特性 | $store | $state |
|------|--------|--------|
| 作用域 | 全局（模块级） | 组件内 |
| 共享方式 | 直接 import | props/context |
| 多个消费者 | 原生支持 | 需要 Context |
| 属性粒度 | 每个属性独立 Signal | 整个对象一个 Signal |

## 工作原理

`$store` 使用 JavaScript Proxy 实现：

```js
export function __store(initialState) {
  const signals = {}
  const proxy = new Proxy({}, {
    get(_, key) {
      if (!signals[key]) return undefined
      return signals[key].value  // 读取时自动建立依赖追踪
    },
    set(_, key, value) {
      if (!signals[key]) {
        signals[key] = new Signal(value)
      } else {
        signals[key].value = value  // 赋值时触发更新
      }
      return true
    }
  })

  // 初始化所有属性为独立的 Signal
  for (const [key, value] of Object.entries(initialState)) {
    signals[key] = new Signal(value)
  }

  return proxy
}
```

## 注意事项

1. **Store 在模块级别声明**
   ```js
   // 正确：在组件外部声明
   const store = $store({ count: 0 })
   function Component() { ... }

   // 错误：在组件内部声明
   function Component() {
     const store = $store({ count: 0 })  // 每次组件渲染都会创建新 store
   }
   ```

2. **避免完全替换 store**
   ```jsx
   // 推荐：修改单个属性
   store.count = 10
   store.user = { name: 'New' }

   // 不推荐：完全替换对象
   Object.assign(store, { count: 10, user: { name: 'New' } })
   ```

3. **类型安全**
   TypeScript 可以推导 store 的类型，但后续赋值可能改变类型：
   ```typescript
   const store = $store({ value: 0 })
   store.value = 'string'  // TypeScript 可能不会报错（取决于配置）
   ```

## 运行时警告

如果 `$store` 在运行时被调用（而不是编译时转换），会收到警告：

```
[Aether] $store() was called at runtime.
Make sure the Aether compiler plugin is configured.
```

## 相关 API

- [$state](./$state.md) - 组件内响应式状态
- [$derived](./$derived.md) - 派生计算值
- [$effect](./$effect.md) - 副作用

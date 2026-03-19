# $async API

声明异步数据源。

## 语法

```typescript
$async<T>(fetcher: () => Promise<T>): {
  readonly value: T | undefined;
  readonly loading: boolean;
  readonly error: Error | null;
  refetch: () => Promise<void>;
}
```

## 参数

| 参数 | 类型 | 描述 |
|------|------|------|
| `fetcher` | `() => Promise<T>` | 返回 Promise 的异步函数 |

## 返回值

返回一个对象，包含以下属性：

| 属性 | 类型 | 描述 |
|------|------|------|
| `value` | `T \| undefined` | 异步数据值（加载完成前为 undefined） |
| `loading` | `boolean` | 是否正在加载 |
| `error` | `Error \| null` | 错误信息（无错误时为 null） |
| `refetch` | `() => Promise<void>` | 手动重新获取数据 |

## 说明

`$async` 用于声明异步数据源，内置管理：

- **loading 状态**: 自动追踪加载状态
- **error 处理**: 自动捕获和暴露错误
- **数据缓存**: 结果缓存到 value 属性
- **手动刷新**: 提供 refetch 方法重新获取数据

## 类型推导

```typescript
// 自动推导 value 类型
const users = $async(() => fetch('/api/users').then(r => r.json()))
// users.value 的类型为 User[] | undefined

// 也可以显式指定类型
interface Post {
  id: number
  title: string
  body: string
}

const posts = $async<Post[]>(() =>
  fetch('/api/posts').then(r => r.json())
)
```

## 用法示例

### 基本使用

```jsx
import { $async, mount } from 'aether'

function UserList() {
  const users = $async(() =>
    fetch('/api/users')
      .then(r => r.json())
  )

  if (users.loading) {
    return <p>Loading...</p>
  }

  if (users.error) {
    return <p>Error: {users.error.message}</p>
  }

  return (
    <ul>
      {users.value?.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  )
}

mount(UserList, '#app')
```

### 带参数的数据获取

```jsx
function UserProfile({ userId }) {
  const userData = $async(() =>
    fetch(`/api/users/${userId}`)
      .then(r => {
        if (!r.ok) throw new Error('User not found')
        return r.json()
      })
  )

  return (
    <div>
      {userData.loading && <p>Loading user...</p>}
      {userData.error && <p>Error: {userData.error.message}</p>}
      {userData.value && (
        <div>
          <h1>{userData.value.name}</h1>
          <p>{userData.value.email}</p>
        </div>
      )}
    </div>
  )
}
```

### 条件数据获取

```jsx
function SearchResults({ query }) {
  const results = $async(async () => {
    if (!query || query.length < 2) {
      return []
    }
    const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
    return response.json()
  })

  if (results.loading) {
    return <p>Searching...</p>
  }

  return (
    <div>
      {results.value?.length === 0 && <p>No results found</p>}
      {results.value?.map(item => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  )
}
```

### 手动刷新

```jsx
function DataWithRefresh() {
  const data = $async(() =>
    fetch('/api/data').then(r => r.json())
  )

  return (
    <div>
      {data.loading && <p>Loading...</p>}
      {data.error && <p>Error: {data.error.message}</p>}
      {data.value && <pre>{JSON.stringify(data.value, null, 2)}</pre>}

      <button onClick={() => data.refetch()} disabled={data.loading}>
        Refresh
      </button>
    </div>
  )
}
```

### 多个异步数据源

```jsx
function Dashboard() {
  const users = $async(() =>
    fetch('/api/users').then(r => r.json())
  )

  const stats = $async(() =>
    fetch('/api/stats').then(r => r.json())
  )

  const notifications = $async(() =>
    fetch('/api/notifications').then(r => r.json())
  )

  const isLoading = $derived(() =>
    users.loading || stats.loading || notifications.loading
  )

  return (
    <div>
      {isLoading ? (
        <p>Loading dashboard...</p>
      ) : (
        <div>
          <section>{/* users */}</section>
          <section>{/* stats */}</section>
          <section>{/* notifications */}</section>
        </div>
      )}
    </div>
  )
}
```

### 组合使用 $async 和 $state

```jsx
function PaginatedList() {
  let page = $state(1)

  const items = $async(() =>
    fetch(`/api/items?page=${page}`)
      .then(r => r.json())
  )

  return (
    <div>
      {items.loading && <p>Loading...</p>}
      {items.value?.map(item => (
        <div key={item.id}>{item.name}</div>
      ))}

      <div>
        <button onClick={() => page--} disabled={page <= 1}>
          Previous
        </button>
        <span>Page {page}</span>
        <button onClick={() => page++} disabled={items.loading}>
          Next
        </button>
      </div>
    </div>
  )
}
```

## 响应式行为

```jsx
const data = $async(() => fetch('/api/data').then(r => r.json()))

// 初始状态
console.log(data.loading)  // true
console.log(data.value)    // undefined
console.log(data.error)    // null

// 等待数据加载...
// 成功后
console.log(data.loading)  // false
console.log(data.value)    // { ... actual data ... }
console.log(data.error)    // null

// 再次调用 refetch 时
await data.refetch()
// loading 会变为 true，然后再次变为 false
```

## 错误处理

```jsx
const data = $async(() => {
  const response = await fetch('/api/data')
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  return response.json()
})

// 在组件中使用
if (data.error) {
  return (
    <div class="error">
      <p>Failed to load data</p>
      <button onClick={() => data.refetch()}>Retry</button>
    </div>
  )
}
```

## 与 $effect + fetch 的对比

| 特性 | $async | $effect + fetch |
|------|--------|-----------------|
| 代码量 | 少 | 多 |
| loading 状态 | 内置 | 需要手动管理 |
| error 状态 | 内置 | 需要手动管理 |
| 立即执行 | 是 | 是 |
| 手动刷新 | refetch() | 需要自己实现 |

## 底层实现

```js
export function __async(fetcher) {
  const data = new Signal(undefined)
  const loading = new Signal(true)
  const error = new Signal(null)

  const resource = {
    get value() { return data.value },
    get loading() { return loading.value },
    get error() { return error.value },
    refetch
  }

  async function refetch() {
    loading._value = true
    error._value = null

    try {
      const result = await fetcher()
      data.value = result
      loading.value = false
    } catch (e) {
      error.value = e
      loading.value = false
    }
  }

  refetch()  // 立即执行

  return resource
}
```

## 注意事项

1. **异步函数立即执行**
   `$async` 创建时会立即调用 fetcher 函数：
   ```jsx
   const data = $async(() => fetch('/api/data').then(r => r.json()))
   // 数据获取立即开始
   ```

2. **refetch 会重置 loading 和 error**
   ```jsx
   await data.refetch()
   // loading 变为 true，error 变为 null，然后根据结果更新
   ```

3. **TypeScript 类型**
   ```typescript
   // value 的类型是 T | undefined
   const data = $async(() => Promise.resolve(42))
   data.value  // number | undefined
   ```

## 运行时警告

如果 `$async` 在运行时被调用（而不是编译时转换），会收到警告：

```
[Aether] $async() was called at runtime.
Make sure the Aether compiler plugin is configured.
```

## 相关 API

- [$state](./$state.md) - 响应式状态
- [$derived](./$derived.md) - 派生计算值
- [$effect](./$effect.md) - 副作用

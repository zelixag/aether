# Router API

编程式导航与 Link 组件。

## 概述

Aether 内置轻量级路由系统，提供：

- `navigate` - 编程式导航
- `Link` - 声明式导航链接
- 路由参数和查询字符串访问

## navigate

### 语法

```typescript
function navigate(to: string, options?: { replace?: boolean }): void
```

### 参数

| 参数 | 类型 | 描述 |
|------|------|------|
| `to` | `string` | 目标路径 |
| `options.replace` | `boolean` | 是否替换当前历史记录（默认 false） |

### 用法示例

```jsx
import { navigate, mount } from 'aether'

function Navigation() {
  return (
    <div>
      <button onClick={() => navigate('/home')}>
        Go Home
      </button>
      <button onClick={() => navigate('/about')}>
        Go About
      </button>
      <button onClick={() => navigate('/user/123')}>
        Go to User 123
      </button>
    </div>
  )
}

mount(Navigation, '#nav')
```

### replace 模式

```jsx
function LoginForm() {
  const handleLogin = async (credentials) => {
    await login(credentials)
    // 替换当前历史记录，避免用户返回登录页
    navigate('/dashboard', { replace: true })
  }

  return (
    <form onSubmit={handleLogin}>
      {/* form fields */}
    </form>
  )
}
```

## Link

### 语法

```typescript
function Link(props: {
  to: string;
  replace?: boolean;
  children?: any;
}): HTMLAnchorElement
```

### 参数

| 参数 | 类型 | 描述 |
|------|------|------|
| `to` | `string` | 链接目标路径 |
| `replace` | `boolean` | 是否替换当前历史记录 |
| `children` | `any` | 链接内容 |

### 用法示例

```jsx
import { Link, mount } from 'aether'

function App() {
  const s = $style`
    .nav { padding: 1rem; background: #f5f5f5; }
    .nav-link { margin-right: 1rem; }
  `

  return (
    <nav class={`nav ${s.scope}`}>
      <a class={`nav-link ${s.scope}`} href="/">Home</a>
      <Link to="/about">About</Link>
      <Link to="/users/123">User Profile</Link>
      <Link to="/settings" replace={true}>Settings</Link>
    </nav>
  )
}
```

### Link vs 普通 `<a>` 标签

| 特性 | Link | `<a>` 标签 |
|------|------|-----------|
| SPA 导航 | 是（history API） | 否（页面刷新） |
| 状态保持 | 是 | 否 |
| 过渡动画 | 易实现 | 需手动处理 |

## 路由参数

### 声明带参数的路由

```jsx
// 用户编写
navigate('/user/123')
navigate('/product/abc')

// 访问参数
console.log(__routeParams)  // { id: '123' } 或 { id: 'abc' }
```

### 在组件中访问路由参数

```jsx
import { __routeParams, $effect, mount } from 'aether'

function UserProfile() {
  const userId = $derived(() => __routeParams.id)

  $effect(() => {
    console.log(`Loading user: ${userId}`)
    // fetch user data based on userId
  })

  return (
    <div>
      <p>User ID: {userId}</p>
    </div>
  )
}

mount(UserProfile, '#app')
```

## 查询字符串

### 构建带查询参数的 URL

```jsx
navigate('/search?q=aether&category=frontend')
```

### 访问查询参数

```jsx
import { __routeQuery, $derived, mount } from 'aether'

function SearchResults() {
  const query = $derived(() => __routeQuery.q)
  const category = $derived(() => __routeQuery.category)

  $effect(() => {
    console.log(`Searching for: ${query}, category: ${category}`)
  })

  return (
    <div>
      <p>Query: {query}</p>
      <p>Category: {category}</p>
    </div>
  )
}
```

## 完整示例

### 带导航的布局

```jsx
import { navigate, Link, $style, mount } from 'aether'

function Layout() {
  const s = $style`
    .layout { min-height: 100vh; display: flex; flex-direction: column; }
    .header { background: #333; color: white; padding: 1rem; }
    .nav { display: flex; gap: 1rem; }
    .nav-link { color: white; text-decoration: none; }
    .nav-link:hover { text-decoration: underline; }
    .main { flex: 1; padding: 2rem; }
    .footer { background: #f5f5f5; padding: 1rem; text-align: center; }
  `

  return (
    <div class={`layout ${s.scope}`}>
      <header class={`header ${s.scope}`}>
        <nav class={`nav ${s.scope}`}>
          <Link to="/" class={`nav-link ${s.scope}`}>Home</Link>
          <Link to="/about" class={`nav-link ${s.scope}`}>About</Link>
          <Link to="/users/1" class={`nav-link ${s.scope}`}>Profile</Link>
        </nav>
      </header>

      <main class={`main ${s.scope}`}>
        {/* 页面内容会根据路由变化 */}
        <div id="page-content">
          <HomePage />
        </div>
      </main>

      <footer class={`footer ${s.scope}`}>
        <p>Built with Aether</p>
      </footer>
    </div>
  )
}

// 监听导航事件（需要在 router 配置中启用）
__router.on('navigate', (path) => {
  console.log(`Navigated to: ${path}`)
})
```

### 条件导航

```jsx
function AuthButton() {
  let isLoggedIn = $state(false)

  return (
    <div>
      {isLoggedIn ? (
        <Link to="/dashboard">Go to Dashboard</Link>
      ) : (
        <Link to="/login">Please Login</Link>
      )}

      <button onClick={() => isLoggedIn = !isLoggedIn}>
        Toggle Auth
      </button>
    </div>
  )
}
```

### 404 处理

```jsx
import { navigate, Link, $style, $state, mount } from 'aether'

function App() {
  const currentPath = $state(window.location.pathname)

  const s = $style`
    .container { padding: 2rem; }
    .not-found { text-align: center; }
  `

  // 简单的路由匹配
  let page = null

  if (currentPath === '/') {
    page = <HomePage />
  } else if (currentPath === '/about') {
    page = <AboutPage />
  } else if (currentPath.startsWith('/user/')) {
    page = <UserPage />
  } else {
    page = (
      <div class={`not-found ${s.scope}`}>
        <h1>404 - Page Not Found</h1>
        <Link to="/">Go Home</Link>
      </div>
    )
  }

  return <div class={`container ${s.scope}`}>{page}</div>
}
```

## 内部 API

### __routePath

当前路由路径：

```js
console.log(__routePath)  // '/users/123'
```

### __routeParams

路由参数对象：

```js
// 路由: /user/:id
console.log(__routeParams)  // { id: '123' }
```

### __routeQuery

查询参数对象：

```js
// URL: /search?q=aether&page=1
console.log(__routeQuery)  // { q: 'aether', page: '1' }
```

## 工作原理

Aether 的路由使用浏览器的 History API：

```js
// navigate 实现
export function navigate(to, { replace = false } = {}) {
  if (replace) {
    history.replaceState(null, '', to)
  } else {
    history.pushState(null, '', to)
  }
  // 触发路由更新事件
  window.dispatchEvent(new PopStateEvent('popstate'))
}
```

## 注意事项

1. **Link 是实际锚点元素**
   ```jsx
   // Link 返回的是真正的 <a> 元素
   const link = Link({ to: '/about', children: 'About' })
   // link instanceof HTMLAnchorElement === true
   ```

2. **navigate 不会触发页面刷新**
   ```jsx
   navigate('/page')  // SPA 导航
   // 等价于: history.pushState(null, '', '/page')
   ```

3. **刷新页面时路由状态**
   ```jsx
   // 浏览器刷新时，__routePath 会恢复为实际 URL
   window.location.pathname  // '/current/path'
   ```

4. **路由变化监听**
   ```js
   window.addEventListener('popstate', () => {
     // 浏览器前进/后退时触发
     console.log(__routePath)
   })
   ```

## 相关 API

- [$state](./$state.md) - 响应式状态
- [$effect](./$effect.md) - 副作用
- [$store](./$store.md) - 全局状态

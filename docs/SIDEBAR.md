# 文档导航

## 快速链接

- [文档首页](./README.md)
- [GitHub 仓库](https://github.com/zelixag/aether)

---

## 目录结构

```
docs/
├── README.md                    # 文档首页
├── guide/
│   ├── getting-started.md       # 快速入门
│   └── concepts.md              # 核心概念
├── api/
│   ├── $state.md                # 响应式状态
│   ├── $derived.md              # 派生计算值
│   ├── $effect.md               # 副作用
│   ├── $store.md                # 跨组件状态
│   ├── $async.md                # 异步数据源
│   ├── $style.md                # 作用域样式
│   ├── mount.md                 # 挂载 API
│   └── router.md                # 路由 API
└── examples/
    └── counter.md               # 计数器示例
```

---

## API 索引

### 响应式核心

| API | 说明 |
|-----|------|
| [$state](./api/$state.md) | 声明响应式状态 |
| [$derived](./api/$derived.md) | 声明派生计算值（惰性、缓存） |
| [$effect](./api/$effect.md) | 声明副作用（自动追踪依赖） |

### 内置功能

| API | 说明 |
|-----|------|
| [$store](./api/$store.md) | 跨组件全局状态 |
| [$async](./api/$async.md) | 异步数据源（自动 loading/error 管理） |
| [$style](./api/$style.md) | 作用域 CSS（编译时 hash） |

### 应用层

| API | 说明 |
|-----|------|
| [mount](./api/mount.md) | 将组件挂载到 DOM |
| [Router](./api/router.md) | 编程式导航与 Link 组件 |

---

## 学习路径

### 新手入门

1. [快速入门](./guide/getting-started.md) - 5 分钟搭建第一个 Aether 项目
2. [计数器示例](./examples/counter.md) - 完整功能演示
3. [$state API](./api/$state.md) - 学习响应式状态

### 深入理解

1. [核心概念](./guide/concepts.md) - Signal/Derived/Effect 原理
2. [$derived API](./api/$derived.md) - 惰性计算与缓存
3. [$effect API](./api/$effect.md) - 副作用与清理

### 高级特性

1. [$store](./api/$store.md) - 跨组件状态管理
2. [$async](./api/$async.md) - 异步数据与状态管理
3. [$style](./api/$style.md) - CSS 作用域隔离
4. [Router](./api/router.md) - SPA 路由

---

## 常用配方

### 计数器

```jsx
let count = $state(0)
<button onClick={() => count++}>{count}</button>
```

### 输入绑定

```jsx
let value = $state('')
<input value={value} onInput={e => value = e.target.value} />
```

### 条件渲染

```jsx
{showModal && <Modal />}
```

### 列表渲染

```jsx
{items.map(item => <Item key={item.id} {...item} />)}
```

### 异步数据

```jsx
const data = $async(() => fetch('/api/data').then(r => r.json()))
{data.loading ? <Spinner /> : <Display data={data.value} />}
```

### 全局状态

```jsx
const store = $store({ user: null, theme: 'dark' })
store.user = newUser  // 任何组件都可访问
```

---

## 外部资源

- [GitHub](https://github.com/zelixag/aether)
- [npm](https://www.npmjs.com/package/aether)

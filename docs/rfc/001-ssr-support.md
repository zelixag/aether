# RFC-001: 服务端渲染 (SSR) 支持

> **状态**: 提议中
> **创建日期**: 2026-03-20
> **作者**: Aether 产品管理 Agent
> **目标版本**: v0.3.0

---

## 一、摘要

本文档提议为 Aether 框架添加服务端渲染（SSR）支持，使框架能够在 Node.js 环境中完成首屏 HTML 直出，然后由客户端接管交互。这将显著改善首次加载性能、SEO 效果，并支持同构应用开发模式。

---

## 二、动机

### 2.1 当前状态

Aether v0.1.0 仅支持客户端渲染（CSR）。所有组件在浏览器中执行，DOM 在客户端构建。这导致：

1. **首屏加载慢**：用户必须等待完整 JS 下载和执行后才能看到内容
2. **SEO 不友好**：搜索引擎爬虫可能无法正确索引动态内容
3. **FLP (First Contentful Paint) 高**：关键内容出现延迟

### 2.2 为什么需要 SSR

根据 README 中的愿景，Aether 的目标用户包括：
- **性能敏感型应用**：电商、SaaS，需要最快首屏加载
- **追求 DX 的初创团队**：希望减少重复工作，一套代码两端运行
- **企业级迁移团队**：从 Next.js/Nuxt 迁移，需要 SSR 能力

### 2.3 竞品状态

| 框架 | SSR 支持 | 实现方式 |
|------|----------|----------|
| React | ✅ (Next.js) | 混合渲染 |
| Vue | ✅ (Nuxt) | 混合渲染 |
| Svelte | ✅ (SvelteKit) | 基于 SvelteKit |
| Solid | 有限 | 需要额外配置 |
| **Aether** | ❌ (待开发) | - |

---

## 三、设计原则

### 3.1 同构代码

Aether 组件代码应该能够在服务器和客户端同时运行，遵循以下原则：

```
┌─────────────────────────────────────────────────────┐
│                   Aether 组件                        │
│   (两边运行同一份代码，自动适配环境)                  │
└─────────────────────────────────────────────────────┘
           │                        ▲
           ▼                        │
    ┌──────────────┐          ┌──────────────┐
    │   Server     │          │   Client     │
    │  (Node.js)  │  hydration  │  (Browser)  │
    │  HTML 直出  │ ──────────▶ │  事件绑定   │
    └──────────────┘          └──────────────┘
```

### 3.2 核心目标

1. **零配置 SSR**：默认行为开箱即用
2. **保持响应式语义**：信号、派生、副作用在 SSR 环境下正确工作
3. **数据序列化**：组件 Props 必须可 JSON 序列化
4. **Hydration 高效**：客户端接管时不应重新渲染整个组件树

---

## 四、详细设计

### 4.1 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                        Aether SSR                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Server    │    │   Render    │    │   Client   │     │
│  │   Entry     │───▶│   Engine    │───▶│   Bundle   │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                │                  │              │
│         │                │                  │              │
│         ▼                ▼                  ▼              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │   Request   │    │  HTML/JSON  │    │  Hydration  │     │
│  │   Handler   │    │   Output    │    │   Phase     │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 核心 API

#### `renderToString(Component, props)`

在服务器端将组件渲染为 HTML 字符串。

```typescript
// server.mjs
import { renderToString } from 'aether/server';
import { App } from './components/App.js';

const html = await renderToString(App, { initialCount: 0 });
```

#### `renderToNodeStream(Component, props)`

在服务器端将组件渲染为 Node.js 流（用于高流量场景）。

```typescript
// server.mjs
import { renderToNodeStream } from 'aether/server';
import { App } from './components/App.js';

response.setHeader('Content-Type', 'text/html');
const stream = renderToNodeStream(App, { initialCount: 0 });
stream.pipe(response);
```

#### `hydrate(root, Component, props)`

在客户端激活服务器渲染的 HTML。

```typescript
// client.mjs
import { hydrate } from 'aether/client';
import { App } from './components/App.js';

hydrate(document.getElementById('app'), App, { initialCount: 0 });
```

### 4.3 编译器改动

#### SSR 模式检测

编译器需要检测代码是否运行在 SSR 环境：

```javascript
// 编译输出 (CSR)
const count = __signal(0);
const double = __derived(() => count.value * 2);

// 编译输出 (SSR) - 不生成 DOM 绑定代码
const count = __signal(0);
const double = __derived(() => count.value * 2);
```

关键区别在于**不生成 DOM 操作代码**，仅执行组件逻辑。

#### 序列化约束

以下 Aether 特性在 SSR 中有约束：

| 特性 | SSR 支持 | 说明 |
|------|----------|------|
| `$state` | ✅ 支持 | Props 必须可序列化 |
| `$derived` | ✅ 支持 | 必须是纯函数 |
| `$effect` | ⚠️ 限制 | 仅在 `hydrate()` 后执行 |
| `$store` | ✅ 支持 | 使用 `serialize()` 导出 |
| `$async` | ✅ 支持 | 返回预加载数据 |
| `$style` | ⚠️ 限制 | 仅生成 class 标记，不注入 |

### 4.4 数据流

#### SSR 数据预加载

```typescript
// 组件中使用 $async
function UserProfile() {
  let user = $async(() => fetchUser(userId));

  return (
    <div>
      {user.loading ? <Loading /> : <div>{user.value.name}</div>}
    </div>
  );
}
```

编译为 SSR 兼容代码：

```javascript
// SSR 编译输出
function UserProfile(props) {
  const resource = __async(() => fetchUser(props.userId));

  // SSR: 同步等待数据（如果使用 await）
  // 返回结构化数据供序列化
  return {
    __html: '...',      // 渲染的 HTML
    __data: {           // 需要传递到客户端的数据
      user: resource.value
    }
  };
}
```

#### Hydration 数据注入

```html
<!-- 服务器输出的 HTML -->
<div id="app">
  <div data-aether-data="{&quot;user&quot;:&quot;...&quot;}">
    <div>Aether User</div>
  </div>
</div>

<script>
  // 客户端读取预加载数据
  window.__AETHER_DATA__ = JSON.parse(
    document.querySelector('[data-aether-data]').dataset.aetherData
  );
</script>
```

### 4.5 路由 SSR

```typescript
// server.mjs
import { createServerRouter } from 'aether/server';

const router = createServerRouter([
  { path: '/', component: Home },
  { path: '/users/:id', component: UserProfile },
  { path: '*', component: NotFound }
]);

// 处理请求
server(async (req, res) => {
  const matched = router.match(req.url);
  const html = await renderToString(matched.component, matched.params);
  res.send(html);
});
```

### 4.6 状态序列化

`$store` 支持在 SSR 环境中序列化：

```typescript
// 组件中使用 store
const appStore = $store({
  theme: 'dark',
  user: { name: 'Aether' }
});

// SSR 编译输出
const appStore = __store({ theme: 'dark', user: { name: 'Aether' }});

// 序列化导出（用于跨请求隔离）
export function serializeStore(store) {
  const signals = store.__signals;
  const data = {};
  for (const key of Object.keys(signals)) {
    data[key] = signals[key]._value;
  }
  return data;
}
```

---

## 五、实施方案

### 5.1 阶段划分

#### Phase 1: 核心 SSR (v0.3.0-alpha)
- 实现 `renderToString()`
- 实现 `renderToNodeStream()`
- 编译器 SSR 模式支持
- 基础 hydration

#### Phase 2: 路由与数据 (v0.3.0-beta)
- 路由 SSR 支持
- `$async` 数据预加载
- `$store` 序列化

#### Phase 3: 完善与优化 (v0.3.0)
- Hydration 性能优化
- 流式 SSR 支持
- 错误边界
- 文档完善

### 5.2 文件结构

```
packages/
├── runtime/
│   ├── src/
│   │   ├── server.js      # 新增: SSR 核心
│   │   ├── hydration.js   # 新增: Hydration 逻辑
│   │   └── ssr/
│   │       ├── render.js  # 渲染入口
│   │       ├── stream.js  # 流式渲染
│   │       └── serialize.js # 序列化工具
│   └── package.json
├── compiler/
│   ├── src/
│   │   ├── transform-ssr.js # 新增: SSR 编译转换
│   │   └── index.js
│   └── package.json
└── server/
    ├── create-server.js    # 新增: 服务端入口
    └── package.json
```

### 5.3 迁移策略

**对于现有 CSR 应用：**
- 默认行为不变，SSR 需要显式配置
- 提供 `aether/ssr` 入口点

**对于新项目：**
- `npm create aether-app --ssr` 一键创建 SSR 项目
- 路由、$async、$store 自动适配 SSR

---

## 六、问题与讨论

### 6.1 开放问题

1. **$effect 执行时机**：SSR 中 $effect 应该在何时执行？
   - 选项 A：完全不执行，hydration 后执行
   - 选项 B：SSR 中执行一次，hydration 后不再执行

2. **客户端数据注入**：window.__AETHER_DATA__ vs DOM 属性 vs Script 标签

3. **流式渲染优先级**：Node.js 流 vs Web Streams

### 6.2 竞品参考

- [Next.js SSR](https://nextjs.org/docs/app/building-your-application/routing/loading-ui-and-streaming)
- [Nuxt SSR](https://nuxt.com/docs/getting-started/introduction)
- [SvelteKit SSR](https://kit.svelte.dev/docs/routing#server)

---

## 七、验收标准

### 7.1 功能验收

- [ ] `renderToString()` 正确输出组件 HTML
- [ ] `renderToNodeStream()` 流式输出正常工作
- [ ] `hydrate()` 正确激活服务端 HTML
- [ ] 嵌套组件 SSR 正确渲染
- [ ] `$async` 数据预加载正常工作
- [ ] 路由 SSR 正确匹配和渲染
- [ ] `$store` 序列化/反序列化正确

### 7.2 性能验收

- [ ] SSR 输出体积 < 同等 React 组件的 50%
- [ ] Hydration 时间 < 100ms（100 节点应用）
- [ ] 流式 SSR 首字节时间 < 50ms

### 7.3 兼容性验收

- [ ] Node.js 18+ 兼容
- [ ] Express/Koa/Fastify 集成示例
- [ ] 现有 CSR 应用不受影响

---

## 八、结论

SSR 支持是 Aether 迈向生产可用的关键一步。通过保持"AI 友好 + 性能优先"的设计理念，我们可以在不增加复杂度的情况下，提供完整的同构应用开发体验。

建议将 SSR 支持作为 v0.3.0 的核心功能，优先实现 `renderToString()` 和基础 hydration。

---

## 九、变更历史

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-03-20 | 0.1 | 初始提案 |

---

*本文档为 RFC（Request for Comments），欢迎社区讨论和反馈。*

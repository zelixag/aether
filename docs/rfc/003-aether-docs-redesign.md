# RFC-003: Aether 文档站点重构 - 用 Aether 重写文档

> **状态**: 提议中
> **创建日期**: 2026-03-20
> **作者**: Aether 产品管理 Agent
> **目标版本**: v0.3.0

---

## 一、摘要

本文档提议将 Aether 文档站点从 VitePress 迁移到使用 Aether 自身构建。核心目标是将 `examples/counter` 展示的 Warm Editorial Brutalism 设计风格（奶油色背景 #f5f0e8、陶土色强调色 #c45d35、Playfair Display 字体、film grain overlay、brutalist box shadows）应用于官方文档，从而实现品牌视觉统一，并展示 Aether 构建复杂内容型网站的能力。

---

## 二、动机

### 2.1 当前问题

| 问题 | 描述 |
|------|------|
| **设计脱节** | Counter 示例展示独特的 Warm Editorial Brutalism 风格，但 GitHub Pages 文档使用 VitePress 默认主题 |
| **品牌认知不一致** | 用户看到两套完全不同的视觉语言，无法建立统一的框架品牌形象 |
| **缺乏独特性** | VitePress 默认主题与众多使用 Docusaurus/VitePress 的项目撞脸 |

### 2.2 用户反馈

> "用户喜欢 `examples/counter/src/main.jsx` 里的网站风格（Warm Editorial Brutalism），但认为 GitHub Pages 的文档站点很丑。用户质疑：在 AI 时代还需要 VitePress 吗？"

### 2.3 战略价值

| 价值 | 说明 |
|------|------|
| **最佳 Showcase** | 用自家框架写文档 = 证明 Aether 能处理复杂内容型网站 |
| **差异化竞争** | 对手都用 Docusaurus/VitePress，Aether 文档将成为独特存在 |
| **真实性** | 开发者更愿意相信"吃自己的狗粮"的产品 |
| **技术验证** | SSR + 复杂样式 + 导航 = 对 Aether 完整压力测试 |

---

## 三、技术方案对比

### 方案 1: VitePress 深度定制

| 维度 | 评估 |
|------|------|
| 工作量 | 2-3 周 |
| 优点 | 现有内容无缝迁移，Markdown 工作流不变，内置功能完整 |
| 缺点 | 仍依赖 VitePress，无法展示 Aether 能力，与竞品撞脸 |
| 风险 | VitePress 版本升级可能破坏定制 |

### 方案 2: Aether 自身重建 (推荐)

| 维度 | 评估 |
|------|------|
| 工作量 | 4-6 周 |
| 优点 | 最佳 Showcase，差异化竞争，"吃自己的狗粮"，技术验证 |
| 缺点 | 需要开发新组件，Markdown/搜索需重新实现 |
| 风险 | 新组件开发可能有未知挑战 |

### 方案 3: 混用方案

| 维度 | 评估 |
|------|------|
| 工作量 | 3-4 周 |
| 优点 | 部分展示 Aether 能力，工作量适中 |
| 缺点 | 架构不清晰，风格统一困难，"半吊子" |
| 风险 | 长期维护困难 |

### 最终建议

**推荐方案 2: 用 Aether 自身重建**

理由：
1. 战略价值最高 - 是展示 Aether 能力的最佳机会
2. 差异化最明显 - 摆脱 VitePress/Docusaurus 生态
3. 真实性最强 - "吃自己的狗粮"

---

## 四、设计原则

### 3.1 核心目标

1. **视觉统一**：将 Warm Editorial Brutalism 风格应用于文档
2. **功能完整**：保持现有文档的所有功能（导航、搜索、代码高亮等）
3. **性能优先**：静态站点生成 (SSG)，首屏加载快
4. **渐进增强**：支持客户端 hydration 实现交互

### 3.2 设计约束

- **SEO 友好**：服务端渲染/预渲染
- **可维护性**：组件化设计，易于扩展
- **部署兼容**：支持 GitHub Pages 部署

### 3.3 非目标

以下内容不在本项目范围内：

| 非目标 | 说明 |
|--------|------|
| **深色模式** | v1.0 后续版本再考虑 |
| **多语言支持** | v1.0 后续版本再考虑 |
| **博客系统** | 保持纯文档站点定位 |
| **用户评论系统** | 使用 GitHub Discussions 替代 |
| **完整的 i18n 框架** | 仅预留扩展接口 |
| **动态内容 API** | 纯静态内容，无需后端 |

---

## 四、详细设计

### 4.1 设计规格

#### 色彩系统 (Warm Editorial Brutalism)

```css
:root {
  --color-bg: #f5f0e8;           /* warm cream */
  --color-bg-warm: #ebe4d8;      /* darker cream */
  --color-ink: #1a1612;          /* near black */
  --color-ink-light: #4a453d;    /* muted text */
  --color-accent: #c45d35;       /* terracotta */
  --color-accent-warm: #e8845f;  /* lighter accent */
  --color-accent-muted: #d4a574; /* muted accent */
  --color-cream: #faf7f2;        /* light cream */
  --color-border: #d4cfc4;       /* warm border */
}
```

#### 字体系统

```css
--font-display: 'Playfair Display', Georgia, serif;
--font-sans: 'DM Sans', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

#### 视觉特效

- Film grain overlay (SVG noise filter)
- Brutalist box shadows (offset solid shadows)
- 微妙动画 (hover states, transitions)

### 4.2 页面结构

```
┌─────────────────────────────────────────────────────────┐
│  Header: Logo | 导航链接 | GitHub 链接 | 版本徽章       │
├──────────────┬──────────────────────────────────────────┤
│              │                                          │
│   Sidebar    │           Main Content                   │
│              │                                          │
│  - Guide     │  ┌────────────────────────────────────┐  │
│    - Getting │  │  Page Title                         │  │
│    - Concepts│  │  ──────────                         │  │
│  - API       │  │                                    │  │
│    - $state  │  │  Content with code blocks,         │  │
│    - $derived│  │  examples, and explanations.       │  │
│    - $effect │  │                                    │  │
│              │  └────────────────────────────────────┘  │
│              │                                          │
│              │  ┌────────────────────────────────────┐  │
│              │  │  Table of Contents (On this page) │  │
│              │  └────────────────────────────────────┘  │
│              │                                          │
│              │  Prev/Next Navigation                    │
├──────────────┴──────────────────────────────────────────┤
│  Footer: Built with Aether | Copyright                  │
└─────────────────────────────────────────────────────────┘
```

### 4.3 组件设计

| 组件 | 职责 |
|------|------|
| `Layout` | 主布局容器，响应式 |
| `Navbar` | 顶部导航栏 |
| `Sidebar` | 侧边栏导航，支持嵌套分组 |
| `DocContent` | 文档内容渲染器 |
| `CodeBlock` | 代码块 + 语法高亮 |
| `TableOfContents` | 页面目录 (TOC) |
| `PrevNext` | 上一页/下一页导航 |
| `Callout` | 提示框 (info/warning/tip) |
| `Badge` | 版本/标签徽章 |

### 4.4 路由结构

```typescript
// 路由配置
const routes = [
  { path: '/', component: HomePage },
  { path: '/guide/getting-started', component: GettingStarted },
  { path: '/guide/concepts', component: Concepts },
  { path: '/api/$state', component: ApiState },
  { path: '/api/$derived', component: ApiDerived },
  { path: '/api/$effect', component: ApiEffect },
  { path: '/api/$store', component: ApiStore },
  { path: '/api/$style', component: ApiStyle },
  { path: '/api/mount', component: ApiMount },
  { path: '/api/router', component: ApiRouter },
  { path: '/architecture', component: Architecture },
  { path: '/performance', component: Performance },
  // ... 其他页面
]
```

### 4.5 构建流程

```bash
# 开发模式
npm run dev
# → Vite 开发服务器，HMR 支持

# 生产构建 (SSG)
npm run build
# → 1. 遍历所有路由
# → 2. 使用 renderToString 预渲染
# → 3. 输出静态 HTML + JS 到 dist/
# → 4. 部署到 GitHub Pages
```

---

## 五、技术方案

### 5.1 Aether 现有能力

| 能力 | 状态 | 说明 |
|------|------|------|
| SSR renderToString | ✅ | packages/runtime/src/ssr.ts |
| SSR renderToStream | ✅ | 流式输出 |
| SSR hydrate | ✅ | 客户端激活 |
| 客户端路由 | ✅ | 动态参数 (:id) |
| Link 组件 | ✅ | 声明式导航 |
| Button 组件 | ✅ | primary/secondary/ghost |
| Card 组件 | ✅ | CardHeader/Body/Footer |
| $style 宏 | ✅ | 作用域样式 |

### 5.2 需要新增的组件

| 组件 | 优先级 | 说明 |
|------|--------|------|
| Sidebar | 高 | 侧边栏导航，支持嵌套 |
| Navbar | 高 | 顶部导航栏 |
| TableOfContents | 中 | 页面目录 |
| CodeBlock | 高 | 代码块 + 高亮 |
| Callout | 中 | 提示框组件 |

### 5.3 需要集成第三方库

| 库 | 用途 | 选型原因 |
|---|------|----------|
| markdown-it | Markdown 解析 | 轻量、SSR 友好 |
| Prism.js | 代码语法高亮 | 纯客户端，无 Node 依赖 |
| Pagefind | 静态搜索 | 专为静态站点设计 |

### 5.4 项目结构

```
docs/
├── src/
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Navbar.tsx
│   │   ├── Sidebar.tsx
│   │   ├── DocContent.tsx
│   │   ├── CodeBlock.tsx
│   │   ├── TableOfContents.tsx
│   │   ├── PrevNext.tsx
│   │   ├── Callout.tsx
│   │   └── index.ts
│   ├── pages/
│   │   ├── index.tsx          # 首页
│   │   ├── guide/
│   │   │   ├── getting-started.tsx
│   │   │   └── concepts.tsx
│   │   ├── api/
│   │   │   ├── $state.tsx
│   │   │   ├── $derived.tsx
│   │   │   └── ...
│   │   └── examples/
│   │       └── counter.tsx
│   ├── styles/
│   │   └── global.css         # Warm Editorial Brutalism
│   ├── router.ts               # 路由配置
│   └── main.tsx                # 入口
├── build.ts                    # SSG 构建脚本
├── server.ts                   # SSR 服务器 (可选)
├── package.json
└── vite.config.ts
```

---

## 六、实施计划

### 阶段 1: 基础架构 (1 周)

- [ ] 创建 docs/src 目录结构
- [ ] 实现 Layout, Navbar, Sidebar 组件
- [ ] 配置路由系统
- [ ] 集成 markdown-it
- [ ] 迁移现有文档内容

### 阶段 2: 功能完善 (1 周)

- [ ] 实现 CodeBlock + Prism.js
- [ ] 实现 TableOfContents
- [ ] 实现 PrevNext 导航
- [ ] 添加 Callout 组件
- [ ] 集成 Pagefind 搜索

### 阶段 3: 样式与交互 (1 周)

- [ ] 应用 Warm Editorial Brutalism 样式
- [ ] 添加 film grain overlay
- [ ] 实现响应式设计
- [ ] 添加页面过渡动画
- [ ] 客户端 hydration

### 阶段 4: 构建与部署 (1 周)

- [ ] 实现 SSG 构建脚本
- [ ] 配置 GitHub Pages 部署
- [ ] 性能优化
- [ ] SEO 优化
- [ ] 测试与调试

---

## 七、验收标准

### 7.1 功能验收

- [ ] 所有现有文档页面可访问
- [ ] 导航（顶部 + 侧边栏）正常工作
- [ ] 代码块语法高亮正常
- [ ] 上一页/下一页导航正常
- [ ] 移动端响应式布局正常

### 7.2 视觉验收

- [ ] Warm Editorial Brutalism 风格一致
- [ ] 色彩系统与 counter 示例一致
- [ ] 字体正确加载 (Playfair Display, DM Sans)
- [ ] Film grain overlay 效果可见
- [ ] Brutalist box shadows 效果正确

### 7.3 性能验收

- [ ] 首屏加载 < 2s (3G)
- [ ] Lighthouse Performance > 90
- [ ] 构建时间 < 30s

### 7.4 部署验收

- [ ] GitHub Pages 部署成功
- [ ] 自定义域名 (如需) 正常
- [ ] HTTPS 正常工作

---

## 八、风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| Markdown 内容迁移工作量大 | 自动化脚本 + 手动校验 |
| 代码高亮 SSR 兼容 | 使用 Prism.js (客户端) |
| 搜索功能实现复杂 | 使用 Pagefind (静态) |
| 构建时间过长 | 增量构建、缓存 |

---

## 九、后续扩展

### 9.1 深色模式

```css
[data-theme="dark"] {
  --color-bg: #1a1612;
  --color-ink: #f5f0e8;
  --color-accent: #e8845f;
}
```

### 9.2 多语言支持

- 提取文案到 locale 文件
- 支持中英文切换

### 9.3 版本切换

- 支持查阅不同版本的文档
- 下拉菜单选择版本

---

## 十、结论

用 Aether 自身重写文档站点是展示框架能力的最佳方式。通过将 Warm Editorial Brutalism 风格应用于文档，我们可以：

1. 建立统一的品牌视觉
2. 证明 Aether 能构建复杂内容型网站
3. 为开发者提供"吃自己狗粮"的真实案例
4. 在竞品中实现差异化

建议将文档重构作为 v0.3.0 的 P1 功能。

---

## 变更历史

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-03-20 | 0.1 | 初始提案 |

---

*本文档为 RFC（Request for Comments），欢迎社区讨论和反馈。*

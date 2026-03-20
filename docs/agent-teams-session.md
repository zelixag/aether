# Agent Teams 实战：如何用 AI Agent 团队完成文档站重构

> 2026-03-20 | Aether 项目

---

## 一、问题背景

用户在浏览 `examples/counter` 和 GitHub Pages 文档站时，发现了明显的风格差异：

| 项目 | 风格 |
|------|------|
| examples/counter | Warm Editorial Brutalism（奶油色背景、陶土色强调、Playfair Display 字体） |
| docs (GitHub Pages) | 默认 VitePress 主题 |

用户提出疑问：
> "在 AI 时代还需要 VitePress 吗？"

---

## 二、解决方案

用 **Agent Teams（AI Agent 团队）** 模式来分析和解决这个问题。

### 2.1 团队组建

根据 README.md 中的团队划分，我组建了一个 **产品管理团队（PM Team）**：

```
team-lead (我)
└── pm-lead (产品管理 Agent)
```

### 2.2 任务分配

| 任务 | 负责人 | 内容 |
|------|--------|------|
| #1 | pm-lead | 分析用户反馈 |
| #2 | pm-lead | 制定技术方案 |
| #3 | pm-lead | 撰写 RFC 文档 |

### 2.3 执行流程

#### Step 1: 创建团队和任务

```bash
# 创建团队
TeamCreate -> "docs-redesign-pm"

# 创建任务
TaskCreate -> "分析用户反馈"
TaskCreate -> "制定技术方案"
TaskCreate -> "撰写 RFC 文档"
```

#### Step 2: 启动 PM Agent

```bash
Agent(spawn) -> pm-lead
  task: "分析用户反馈，输出到 memory/analysis_doc_redesign.md"
```

#### Step 3: PM Agent 执行并汇报

pm-lead 完成了：

1. **用户反馈分析**
   - 核心痛点：counter 示例风格 vs 文档站风格不统一
   - 战略价值：用自家框架写文档 = 最佳 showcase
   - 吃自己的狗粮 = 真实性

2. **技术方案制定**
   - Aether 现有能力评估（SSR、路由、组件）
   - 需要新增组件：Sidebar, Navbar, CodeBlock, TOC, Callout
   - 推荐架构：SSG + markdown-it + Prism.js + Pagefind

3. **RFC-003 撰写**
   - 完整的技术方案文档
   - 包含设计规格、实施计划、验收标准

---

## 三、实现尝试

### 3.1 创建文档站结构

```
docs/src/
├── components/
│   ├── Layout.tsx
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   ├── CodeBlock.tsx
│   ├── DocContent.tsx
│   ├── Callout.tsx
│   ├── PrevNext.tsx
│   └── TableOfContents.tsx
├── pages/
│   ├── index.tsx
│   ├── guide/getting-started.tsx
│   └── api/$state.tsx
├── styles/
│   └── global.css  (Warm Editorial Brutalism)
├── main.ts
└── index.html
```

### 3.2 CSS 变量系统

```css
:root {
  --color-bg: #f5f0e8;           /* warm cream */
  --color-bg-warm: #ebe4d8;
  --color-ink: #1a1612;
  --color-ink-light: #4a453d;
  --color-accent: #c45d35;        /* terracotta */
  --color-accent-warm: #e8845f;
  --color-cream: #faf7f2;
  --color-border: #d4cfc4;

  --font-display: 'Playfair Display', Georgia, serif;
  --font-sans: 'DM Sans', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

### 3.3 遇到的问题

**JSX 编译失败** - Vite 的 oxc 预编译器无法解析 JSX 语法

```
Error: Unexpected token
src/components/Layout.tsx:24:45
```

**原因分析：**
- Aether 编译器需要先转换 JSX
- 但 Vite 的预编译器（oxc）在 Aether 之前运行
- 导致 JSX 没有被正确转译

**排查过程：**
1. 检查 counter example 的配置（正常工作）
2. 简化组件（仍然失败）
3. 尝试不同文件扩展名（.ts -> .tsx -> .jsx）
4. 问题持续存在

---

## 四、Agent Teams 工作流总结

### 4.1 适合使用 Agent Teams 的场景

| 场景 | 适用性 |
|------|--------|
| 需要多方分析的问题 | ✅ 适合 |
| 复杂技术方案设计 | ✅ 适合 |
| 快速实现简单任务 | ❌ 过度设计 |
| 需要调试的环境问题 | ❌ 团队效率低 |

### 4.2 Agent Teams 命令参考

```bash
# 创建团队
TeamCreate(team_name="xxx", description="xxx")

# 创建任务
TaskCreate(subject="xxx", description="xxx")

# 启动 Agent
Agent(description="xxx", prompt="xxx", team_name="xxx")

# 更新任务状态
TaskUpdate(taskId="6", status="in_progress")

# 发送消息
SendMessage(to="pm-lead", message="xxx", summary="xxx")

# 关闭团队
TeamDelete()
```

### 4.3 经验教训

**1. PM 团队适合分析阶段**
- 可以并行思考多个方案
- 自动生成文档结构
- 但执行实现时效率不高

**2. 技术问题最好自己直接解决**
- Agent 调试环境配置效率低
- 需要实时反馈和快速迭代
- Agent 更适合研究和文档

**3. 关闭团队时可能遇到循环通知**
- PM Agent 可能陷入 idle 循环
- 需要多次发送 shutdown 信号
- 或者直接删除团队目录

---

## 五、RFC-003 核心内容

RFC 已保存在：`docs/rfc/003-aether-docs-redesign.md`

**核心结论：**
- 用 Aether 自身重写文档站
- 应用 Warm Editorial Brutalism 风格
- SSG 架构部署到 GitHub Pages

**工作量评估：**
- 4 周
- 5 个新组件
- 4 个阶段

---

## 六、后续建议

1. **方案 A（最快）：** 基于现有 VitePress，只定制 CSS 样式
2. **方案 B（最干净）：** 创建独立 `apps/docs/` 目录完全重来
3. **方案 C（最彻底）：** 继续调试 Aether 编译器配置

---

## 七、关键文件

| 文件 | 用途 |
|------|------|
| `docs/rfc/003-aether-docs-redesign.md` | RFC 文档 |
| `docs/src/styles/global.css` | CSS 变量系统 |
| `docs/src/components/*.tsx` | 组件库（未完成） |
| `examples/counter/src/main.jsx` | Warm Editorial Brutalism 参考 |

---

*本文档由 Claude Code + Agent Teams 模式生成*

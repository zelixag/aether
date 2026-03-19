# RFC-002: Aether CLI 脚手架工具

> **状态**: 提议中
> **创建日期**: 2026-03-20
> **作者**: Aether 产品管理 Agent
> **目标版本**: v0.2.0

---

## 一、摘要

本文档提议为 Aether 框架创建一个命令行界面（CLI）脚手架工具，使开发者能够通过 `npm create aether-app` 命令快速创建、开发和构建 Aether 项目。该工具将降低入门门槛，提供最佳开发实践模板，并支持项目初始化、开发服务器和生产构建。

---

## 二、动机

### 2.1 当前状态

Aether v0.1.0 提供了：
- `@aether/compiler` - Babel 插件
- `@aether/runtime` - 运行时库
- `vite.config.js` 手动配置示例

但开发者需要手动：
1. 创建项目目录和 package.json
2. 配置 Vite + Babel
3. 编写入口文件
4. 配置 TypeScript（可选）

### 2.2 为什么需要 CLI

根据 README 愿景，Aether 的目标用户包括：
- **追求 DX 的初创团队**：希望减少框架学习成本，快速上手
- **AI 代码助手**：需要一个标准化项目结构来生成代码
- **企业级迁移团队**：需要平滑的迁移路径和工具支持

一个好的 CLI 工具可以：
1. **降低认知负担**：一键创建完整项目
2. **保证最佳实践**：内置性能优化、安全配置
3. **提供交互式体验**：菜单选择而非配置文件
4. **统一项目结构**：便于社区共享代码和模板

### 2.3 竞品状态

| 框架 | CLI 工具 | 特性 |
|------|----------|------|
| React | `create-react-app` / `Vite` | 模板丰富 |
| Vue | `create-vue` | 交互式选项 |
| Svelte | `sv` / `degit` | 轻量 |
| Solid | `solid-ts-template` | 官方模板 |
| **Aether** | ❌ (待开发) | - |

---

## 三、设计原则

### 3.1 核心目标

1. **零配置体验**：`npx create-aether-app my-app` 直接可用
2. **交互式选项**：TypeScript 支持、SSR 支持等可选择
3. **快速开发**：内置 Vite 开发服务器，即时 HMR
4. **生产构建**：优化后的生产构建，一键部署

### 3.2 设计约束

- **轻量化**：CLI 本身 < 1MB
- **离线可用**：创建后不依赖 CLI，二进制内置
- **可扩展**：支持社区模板

---

## 四、详细设计

### 4.1 命令设计

```bash
# 创建新项目（交互式）
npm create aether-app

# 创建新项目（非交互式）
npm create aether-app my-app
npm create aether-app my-app --template minimal
npm create aether-app my-app --template ts --ssr

# 附加命令
aether --version
aether --help
aether add <package>    # 添加官方包
aether build            # 生产构建
aether dev              # 开发服务器
aether preview          # 预览构建
```

### 4.2 项目模板

#### Minimal 模板（默认）

适合学习和小项目：

```
my-app/
├── src/
│   ├── main.jsx          # 入口文件
│   └── App.jsx           # 主组件
├── public/
│   └── index.html
├── package.json
├── vite.config.js        # Aether 预设
└── README.md
```

#### TypeScript 模板

适合生产项目：

```
my-app/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   └── components/       # 组件目录
├── public/
│   └── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

#### SSR 模板

适合需要 SEO 的应用：

```
my-app/
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── entry-client.tsx   # 客户端入口
│   └── entry-server.tsx  # 服务端入口
├── public/
│   └── index.html
├── package.json
├── vite.config.ts
└── README.md
```

### 4.3 交互式流程

```
$ npm create aether-app

┌─────────────────────────────────────────────┐
│                                             │
│     ░█▀▀█ ▀▀█▀▀ ░█▀▀█ ░█▀▀▀ ░█▄─░█         │
│     ░█▄▄█ ─░█── ░█▄▄▀ ──▀▀▄ ░█░█░█         │
│     ░█─░█ ─░█── ░█─░█ ░█▄▄▀ ░█──▀          │
│                                             │
│     AI-Friendly Reactive Framework           │
│                                             │
└─────────────────────────────────────────────┘

? 项目名称: my-aether-app
? 模板:
  ❯ minimal (默认)
    minimal-ts (TypeScript)
    ssr (服务端渲染)
    ssr-ts (SSR + TypeScript)
? 是否使用 TypeScript? (Y/n) n
? 是否启用 SSR? (y/N) N
? 是否安装依赖? (Y/n) Y

正在创建项目...
✓ 下载模板
✓ 安装依赖
✓ 初始化完成

cd my-aether-app
npm run dev     # 启动开发服务器
npm run build   # 生产构建
```

### 4.4 内置功能

#### 开发服务器

```javascript
// vite.config.js 预设
import { defineConfig } from 'vite';
import aether from '@aether/vite-plugin';

export default defineConfig({
  plugins: [aether()],
  server: {
    port: 3000,
    open: true        // 自动打开浏览器
  },
  build: {
    target: 'esnext',
    minify: 'esbuild'
  }
});
```

#### 生产构建

```bash
$ npm run build

> my-app@0.1.0 build
> vite build

✓ 32 KB built (gzip: 12 KB)
✓ 输出到 dist/
```

### 4.5 CLI 架构

```
create-aether-app/
├── bin/
│   └── create-aether-app.js   # CLI 入口
├── src/
│   ├── index.js               # 主逻辑
│   ├── create.js              # 项目创建
│   ├── prompts.js             # 交互式选项
│   ├── templates/              # 模板文件
│   │   ├── minimal/
│   │   ├── minimal-ts/
│   │   ├── ssr/
│   │   └── ssr-ts/
│   ├── install.js             # 依赖安装
│   └── print.js               # 终端输出
└── package.json
```

---

## 五、实现方案

### 5.1 技术选型

| 组件 | 选择 | 原因 |
|------|------|------|
| CLI 框架 | `cac` | 轻量、API 简洁 |
| 交互式 | `prompts` | 体验好、TypeScript 支持 |
| 模板下载 | `degit` | 快速、支持 GitHub |
| 包管理 | `npm`/`pnpm` | 用户选择 |

### 5.2 入口文件

```javascript
#!/usr/bin/env node

import cac from 'cac';
import { version } from './package.json';

const cli = cac('create-aether-app');

cli
  .command('[dir]', '创建新项目')
  .option('-t, --template <name>', '选择模板')
  .option('-y, --yes', '跳过交互式问题')
  .option('--no-git', '跳过 git 初始化')
  .action(async (dir, options) => {
    const { createProject } = await import('./src/create.js');
    await createProject({ dir, ...options });
  });

cli.help();
cli.version(version);
cli.parse();
```

### 5.3 项目创建流程

```javascript
// src/create.js
export async function createProject(options) {
  const { dir, template, skipPrompts } = options;

  // 1. 收集用户选项
  const answers = skipPrompts
    ? getDefaultAnswers()
    : await prompts(options);

  // 2. 创建项目目录
  const projectDir = await createDirectory(dir);

  // 3. 下载模板
  await downloadTemplate(answers.template, projectDir);

  // 4. 安装依赖
  if (answers.install) {
    await installDependencies(projectDir, answers.packageManager);
  }

  // 5. 初始化 Git（可选）
  if (answers.git) {
    await initGit(projectDir);
  }

  // 6. 打印成功信息
  printSuccess(projectDir, answers);
}
```

---

## 六、验收标准

### 6.1 功能验收

- [ ] `npx create-aether-app` 启动交互式 CLI
- [ ] 创建 minimal 模板项目
- [ ] 创建 TypeScript 模板项目
- [ ] 创建 SSR 模板项目
- [ ] 正确安装依赖
- [ ] `npm run dev` 启动开发服务器
- [ ] `npm run build` 生成生产构建

### 6.2 体验验收

- [ ] CLI 输出美观（ASCII 艺术）
- [ ] 进度提示清晰
- [ ] 错误信息友好
- [ ] 创建时间 < 30s（不含网络下载）

### 6.3 兼容性验收

- [ ] Node.js 16+ 兼容
- [ ] npm、pnpm、yarn 兼容
- [ ] Windows、macOS、Linux 兼容

---

## 七、后续扩展

### 7.1 `aether add` 命令

```bash
# 添加官方包
aether add router      # 添加路由
aether add store       # 添加状态管理
aether add ui          # 添加 UI 组件库

# 添加第三方包
aether add @tanstack/react-query  # React Query（兼容层）
```

### 7.2 `aether init` 命令

```bash
# 在现有项目中初始化 Aether
cd my-existing-project
aether init
```

---

## 八、结论

Aether CLI 是提升开发者体验的关键工具。通过提供交互式项目创建、最佳实践模板和一键开发/构建能力，我们可以显著降低 Aether 的入门门槛，吸引更多开发者试用。

建议将 CLI 工具作为 v0.2.0 的 P1 功能，与测试覆盖率、TypeScript 类型完善并列。

---

## 九、变更历史

| 日期 | 版本 | 变更内容 |
|------|------|----------|
| 2026-03-20 | 0.1 | 初始提案 |

---

*本文档为 RFC（Request for Comments），欢迎社区讨论和反馈。*

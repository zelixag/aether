# Aether Framework Documentation

Aether 是一个极简主义的响应式前端框架，核心 runtime 仅 **< 3KB**。通过编译时宏转换，实现优雅的响应式语法，无需 Hooks 规则，无需 .value 手动追踪。

## 核心特性

- **宏驱动的响应式**: `$state`, `$derived`, `$effect` 自动追踪依赖
- **极小体积**: 核心 runtime < 3KB (minified)
- **细粒度 DOM 更新**: 直接操作 DOM，无虚拟 DOM 开销
- **零 Hooks 规则**: 响应式变量可在任意位置声明使用
- **内置功能**: `$store` (跨组件状态), `$async` (异步数据), `$style` (作用域 CSS)

## 文档结构

### 入门指南

- [快速入门](./guide/getting-started.md) - 搭建第一个 Aether 项目
- [核心概念](./guide/concepts.md) - 响应式原理与架构

### API 文档

- [$state](./api/$state.md) - 声明响应式状态
- [$derived](./api/$derived.md) - 声明派生计算值
- [$effect](./api/$effect.md) - 声明副作用
- [$store](./api/$store.md) - 跨组件全局状态
- [$async](./api/$async.md) - 异步数据源
- [$style](./api/$style.md) - 作用域样式
- [mount](./api/mount.md) - 挂载组件到 DOM
- [Router](./api/router.md) - 编程式导航与 Link 组件

### 示例

- [计数器示例](./examples/counter.md) - 完整的功能演示

## 快速预览

```jsx
import { $state, $derived, $effect, $store, $style, mount } from 'aether'

const appStore = $store({ theme: 'dark', user: 'Aether' })

function Counter() {
  let count = $state(0)
  let double = $derived(() => count * 2)

  $effect(() => {
    document.title = `Count: ${count}`
  })

  const s = $style`
    .counter { text-align: center; padding: 2rem; }
    .btn { padding: 0.5rem 1rem; }
  `

  return (
    <div class="counter">
      <p>Count: {count}</p>
      <p>Double: {double}</p>
      <button class="btn" onClick={() => count++}>+</button>
    </div>
  )
}

mount(Counter, '#app')
```

## 安装

```bash
npm install aether aether-compiler
```

## 配置构建工具

详见[快速入门](./guide/getting-started.md)。

## 与其他框架对比

| 特性 | Aether | React | Vue |
|------|--------|-------|-----|
| 体积 | < 3KB | ~40KB | ~30KB |
| 响应式语法 | 宏 ($state) | Hooks (useState) | ref() |
| DOM 更新 | 细粒度直接操作 | 虚拟 DOM | 虚拟 DOM |
| 学习曲线 | 低 | 中 | 低 |
| 状态管理 | 内置 $store | Context/Redux | Pinia |

## License

MIT

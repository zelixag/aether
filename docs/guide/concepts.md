# 核心概念

理解 Aether 的响应式原理和架构设计。

## 响应式基础

Aether 的响应式系统基于三个核心概念：

1. **Signal (信号)**: 响应式状态容器
2. **Derived (派生)**: 基于信号的计算值
3. **Effect (副作用)**: 响应状态变化的副作用

### Signal

Signal 是最小的响应式单元：

```js
import { __signal } from 'aether'

const count = __signal(0)

console.log(count.value)  // 0
count.value = 10         // 触发更新
console.log(count.value)  // 10
```

当你读取 `count.value` 时，如果当前有活跃的 Effect，Aether 会自动建立订阅关系。

### Derived

Derived 是基于其他 Signal 的计算值，带缓存：

```js
const double = __derived(() => count.value * 2)

// 只有当 count.value 变化时，double 才会重新计算
// 并且只在 .value 被读取时才会重新计算（惰性求值）
```

### Effect

Effect 是当响应式状态变化时自动执行的副作用：

```js
__effect(() => {
  console.log(`Count changed to: ${count.value}`)
})
// 当 count.value 变化时，这个函数会自动执行
```

## 依赖追踪

Aether 使用**自动依赖追踪**系统。当你在 Effect 或 Derived 的函数中读取 Signal 的值时，Aether 会自动建立依赖关系：

```js
$effect(() => {
  // 自动追踪 a 和 b 的变化
  console.log(a + b)
})
```

这比手动声明依赖（如 React 的 useEffect 数组）更加直观。

## 编译时宏转换

Aether 的 `$state`, `$derived`, `$effect` 是**编译时宏**。编译器会转换代码：

| 用户编写 | 编译后 |
|----------|--------|
| `let count = $state(0)` | `const count = __signal(0)` |
| `let double = $derived(() => count * 2)` | `const double = __derived(() => count.value * 2)` |
| `count++` | `count.value++` |
| `count` (读取) | `count.value` |

这使得用户代码无需写 `.value`，同时运行时保持极小体积。

## 批量更新

当多个 Signal 同时变化时，Aether 使用**批量更新**来避免重复执行：

```js
$effect(() => {
  console.log(count, double)  // 只执行一次，即使 count 变化触发 double 变化
})

count.value++
// count 变化会触发 double 变化
// 但 Effect 只在微任务队列中执行一次
```

## 细粒度 DOM 更新

传统的虚拟 DOM 框架会重新渲染整个组件。Aether 使用**细粒度 DOM 更新**：

```jsx
function Counter() {
  let count = $state(0)

  return (
    <div>
      <p>{count}</p>      {/* 只有这个文本节点会更新 */}
      <span>{count * 2}</span>
    </div>
  )
}
```

当 `count` 变化时，只有包含 `{count}` 的文本节点会被更新，其他 DOM 节点完全不受影响。

## 组件卸载清理

Effect 会在组件卸载时自动清理：

```jsx
function Component() {
  $effect(() => {
    const handler = () => console.log('click')
    document.addEventListener('click', handler)

    // 返回清理函数
    return () => document.removeEventListener('click', handler)
  })

  // 组件卸载时，effect 自动清理
}
```

## 与其他框架的对比

### vs React Hooks

| 特性 | Aether | React |
|------|--------|-------|
| 状态声明 | `$state(value)` | `useState(value)` |
| 依赖声明 | 自动追踪 | 手动依赖数组 |
| 规则 | 无 | 不能在条件/循环中使用 Hooks |
| 更新粒度 | 细粒度 | 组件级 |

### vs Vue

| 特性 | Aether | Vue |
|------|--------|-----|
| 响应式变量 | `$state(value)` | `ref(value)` |
| 计算属性 | `$derived(() => expr)` | `computed(() => expr)` |
| 副作用 | `$effect(() => {...})` | `watchEffect(() => {...})` |
| 状态语法 | 直接写 `count++` | 需要写 `count.value++` |

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                     用户代码                              │
│  $state, $derived, $effect, $store, $async, $style      │
└─────────────────────┬───────────────────────────────────┘
                      │ 编译时转换
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   aether-compiler                        │
│  宏转换、JSX 转换、样式处理                               │
└─────────────────────┬───────────────────────────────────┘
                      │ 生成的代码
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    aether runtime                        │
│  Signal, Derived, Effect, Store, Async, Router, DOM      │
└─────────────────────────────────────────────────────────┘
```

## 性能标记

Aether 在开发模式下支持性能标记：

```js
// 开启 DEV 模式后，可以使用 performance.mark 查看
performance.mark('aether:effect:start')
// ... effect 执行
performance.mark('aether:effect:end')
performance.measure('effect', 'aether:effect:start', 'aether:effect:end')
```

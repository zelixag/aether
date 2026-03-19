# $derived API

声明派生计算值。

## 语法

```typescript
$derived<T>(fn: () => T): T
```

## 参数

| 参数 | 类型 | 描述 |
|------|------|------|
| `fn` | `() => T` | 计算函数，返回派生值 |

## 返回值

返回一个派生计算值，其类型为函数返回值类型。

## 说明

`$derived` 用于声明基于其他响应式状态的计算值。它具有以下特性：

1. **自动依赖追踪**: 当依赖的 Signal 变化时，自动标记为 dirty
2. **惰性计算**: 只在 `.value` 被读取时才重新计算
3. **结果缓存**: 计算结果被缓存，直到依赖变化才重新计算

## 类型推导

```typescript
let count = $state(0)
let double = $derived(() => count * 2)    // double 类型为 number
let text = $derived(() => `Count: ${count}`) // text 类型为 string
```

## 用法示例

### 基本使用

```jsx
import { $state, $derived, mount } from 'aether'

function Counter() {
  let count = $state(0)
  let double = $derived(() => count * 2)
  let isEven = $derived(() => count % 2 === 0)

  return (
    <div>
      <p>Count: {count}</p>
      <p>Double: {double}</p>
      <p>Is Even: {isEven ? 'Yes' : 'No'}</p>
      <button onClick={() => count++}>Increment</button>
    </div>
  )
}

mount(Counter, '#app')
```

### 复杂计算

```jsx
function UserStats() {
  let users = $state([
    { name: 'Alice', score: 85 },
    { name: 'Bob', score: 92 },
    { name: 'Charlie', score: 78 }
  ])

  let averageScore = $derived(() => {
    const total = users.reduce((sum, u) => sum + u.score, 0)
    return (total / users.length).toFixed(1)
  })

  let highestScore = $derived(() =>
    Math.max(...users.map(u => u.score))
  )

  let topScorer = $derived(() =>
    users.find(u => u.score === highestScore)?.name
  )

  return (
    <div>
      <p>Average Score: {averageScore}</p>
      <p>Highest Score: {highestScore}</p>
      <p>Top Scorer: {topScorer}</p>
    </div>
  )
}
```

### 链式派生

```jsx
function ChainDemo() {
  let base = $state(2)
  let squared = $derived(() => base * base)
  let cubed = $derived(() => squared * base)  // 基于另一个 derived
  let formatted = $derived(() => `Result: ${cubed}`)

  return (
    <div>
      <p>Base: {base}</p>
      <p>Squared: {squared}</p>
      <p>Cubed: {cubed}</p>
      <p>{formatted}</p>
    </div>
  )
}
```

### 在 JSX 中直接使用

```jsx
function FormattedList() {
  let items = $state(['apple', 'banana', 'cherry'])
  let count = $state(0)

  // derived 可以直接用在 JSX 中
  let visibleItems = $derived(() => items.slice(0, count || items.length))
  let hasMore = $derived(() => count > 0 && count < items.length)

  return (
    <div>
      <ul>
        {visibleItems.map(item => <li key={item}>{item}</li>)}
      </ul>
      {hasMore && <p>And more...</p>}
      <button onClick={() => count = count > 0 ? 0 : 2}>
        {count > 0 ? 'Show Less' : 'Show More'}
      </button>
    </div>
  )
}
```

## 惰性计算说明

Derived 的计算是惰性的（Lazy）：

```jsx
let a = $state(1)
let b = $derived(() => {
  console.log('Computing b...')  // 这行只在你读取 b 时执行
  return a * 2
})

console.log('Before reading b')
// 此时 b 没有被读取，所以计算函数不会执行
// 输出: "Before reading b"

console.log(b)  // 读取 b
// 输出: "Computing b..."
// 输出: 2
```

这与 `$effect` 不同，`$effect` 会立即执行一次，而 `$derived` 只在需要时才计算。

## 缓存机制

Derived 的结果是缓存的，只要依赖没有变化，后续读取直接返回缓存值：

```jsx
let count = $state(0)
let double = $derived(() => {
  console.log('Computing...')  // 只执行一次
  return count * 2
})

console.log(double)  // Computing... 2
console.log(double)  // 直接返回 2（不打印 Computing）
console.log(double)  // 直接返回 2（不打印 Computing）

count = 5
console.log(double)  // Computing... 10（依赖变化，重新计算）
console.log(double)  // 直接返回 10
```

## 批量更新中的 Derived

当依赖在同一次批量更新中变化多次，Derived 只重新计算一次：

```jsx
let x = $state(1)
let y = $state(2)
let sum = $derived(() => {
  console.log('Computing sum...')
  return x + y
})

// 假设有批量更新 x=10, y=20
// sum 只会重新计算一次，而不是两次
```

## 运行时警告

如果 `$derived` 在运行时被调用（而不是编译时转换），会收到警告：

```
[Aether] $derived() was called at runtime.
Make sure the Aether compiler plugin is configured.
```

## 底层实现

编译后，`$derived(() => expr)` 转换为：

```js
const derived = __derived(() => expr)
```

`__derived` 是 Aether runtime 中的 `Derived` 类实例：

```js
export class Derived {
  constructor(fn) {
    this._fn = fn
    this._signal = new Signal(undefined)
    this._dependencies = new Set()
    this._dirty = true
    this._compute()  // 初次计算
  }

  _compute() {
    this._cleanupDeps()
    __pushEffect(this)
    try {
      this._signal._value = this._fn()
      this._dirty = false
    } finally {
      __popEffect()
    }
  }

  get value() {
    if (this._dirty) {
      this._compute()
    }
    // 代理到内部信号的读取
    return this._signal._value
  }
}
```

## 注意事项

1. **Derived 函数应该是纯函数**
   ```jsx
   // 推荐：纯函数
   let doubled = $derived(() => count * 2)

   // 不推荐：在 derived 中修改状态（可能导致无限循环）
   let bad = $derived(() => {
     count++  // 不要这样做！
     return count
   })
   ```

2. **避免副作用**
   ```jsx
   // 不要在 derived 中执行副作用
   let data = $derived(() => {
     console.log('side effect')  // 不要这样做
     return fetchData()
   })
   ```

3. **长计算使用 $effect**
   如果计算代价很高且结果需要被多个消费者共享，考虑使用 `$effect` 手动管理。

## 相关 API

- [$state](./$state.md) - 响应式状态
- [$effect](./$effect.md) - 副作用
- [$store](./$store.md) - 跨组件全局状态

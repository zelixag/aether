# $effect API

声明副作用。

## 语法

```typescript
$effect(fn: () => void | (() => void)): void
```

## 参数

| 参数 | 类型 | 描述 |
|------|------|------|
| `fn` | `() => void \| (() => void)` | 副作用函数，可返回清理函数 |

## 返回值

无。

## 说明

`$effect` 用于声明当响应式依赖变化时需要执行的副作用。与 `$derived` 不同，`$effect` 适合执行：

- DOM 操作
- 数据获取
- 订阅外部数据源
- 设置/清除定时器
- 添加/移除事件监听器

## 核心特性

1. **自动依赖追踪**: 自动追踪函数体内读取的所有 Signal
2. **立即执行**: 创建时立即执行一次
3. **自动清理**: 组件卸载时自动执行清理函数
4. **返回清理函数**: 可返回一个清理函数

## 用法示例

### 基本使用

```jsx
import { $state, $effect, mount } from 'aether'

function Counter() {
  let count = $state(0)

  $effect(() => {
    console.log(`Count changed to: ${count}`)
  })

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => count++}>Increment</button>
    </div>
  )
}

mount(Counter, '#app')
```

### 更新文档标题

```jsx
function DocumentTitle() {
  let title = $state('Default Title')

  $effect(() => {
    document.title = title
  })

  return (
    <div>
      <input
        value={title}
        onInput={e => title = e.target.value}
      />
    </div>
  )
}
```

### 事件监听

```jsx
function MouseTracker() {
  let x = $state(0)
  let y = $state(0)

  $effect(() => {
    const handleMouseMove = (e) => {
      x = e.clientX
      y = e.clientY
    }

    window.addEventListener('mousemove', handleMouseMove)

    // 返回清理函数
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
    }
  })

  return (
    <div>
      Mouse position: {x}, {y}
    </div>
  )
}
```

### 定时器

```jsx
function Timer() {
  let seconds = $state(0)
  let intervalId = null

  $effect(() => {
    intervalId = setInterval(() => {
      seconds++
    }, 1000)

    // 清理函数：组件卸载时清除定时器
    return () => {
      clearInterval(intervalId)
    }
  })

  return (
    <div>
      <p>Seconds: {seconds}</p>
    </div>
  )
}
```

### 条件副作用

```jsx
function ConditionalEffect() {
  let enabled = $state(true)
  let data = $state('initial')

  $effect(() => {
    if (!enabled) return  // 条件判断

    // 这个 effect 只在 enabled 为 true 时执行
    console.log('Fetching data...')
    // fetchData().then(result => data = result)
  })

  return (
    <div>
      <button onClick={() => enabled = !enabled}>
        {enabled ? 'Disable' : 'Enable'}
      </button>
      <p>Data: {data}</p>
    </div>
  )
}
```

### 使用清理函数重置状态

```jsx
function EditMode() {
  let isEditing = $state(false)
  let editValue = $state('')

  $effect(() => {
    if (isEditing) {
      // 进入编辑模式：获取当前值作为初始值
      editValue = 'some current value'
    } else {
      // 退出编辑模式：清理编辑值
      editValue = ''
    }
  })

  return (
    <div>
      <button onClick={() => isEditing = !isEditing}>
        {isEditing ? 'Cancel' : 'Edit'}
      </button>
      {isEditing && (
        <input value={editValue} />
      )}
    </div>
  )
}
```

## 与 $derived 的区别

| 特性 | $effect | $derived |
|------|---------|----------|
| 立即执行 | 是 | 否（惰性） |
| 返回值 | 无（返回清理函数） | 有（计算值） |
| 用途 | 副作用（DOM、订阅等） | 计算值 |
| 是否缓存 | 否 | 是 |
| 适用场景 | 事件监听、定时器、DOM 更新 | 数据转换、格式化 |

```jsx
// 用 $effect 更新 DOM
$effect(() => {
  document.title = `Count: ${count}`
})

// 用 $derived 计算派生值
let doubled = $derived(() => count * 2)
```

## 依赖追踪机制

```jsx
let a = $state(1)
let b = $state(2)
let c = $state(3)

$effect(() => {
  // 追踪 a 和 b 的变化，不追踪 c
  console.log(a + b)
})

a = 10  // 触发 effect
b = 20  // 触发 effect
c = 30  // 不触发 effect（没有被读取）
```

## 批量更新

当多个依赖同时变化，effect 只执行一次：

```jsx
let x = $state(1)
let y = $state(2)

$effect(() => {
  console.log(`x: ${x}, y: ${y}`)
})

// 如果在某次批量更新中 x 和 y 同时变化
// effect 只执行一次
```

## 组件卸载清理

当组件卸载时，所有在组件内创建的 effect 都会自动清理：

```jsx
function ComponentWithEffect() {
  $effect(() => {
    const timer = setInterval(() => {
      console.log('tick')
    }, 1000)

    // 组件卸载时，这个清理函数会被调用
    return () => clearInterval(timer)
  })

  // 组件卸载时：
  // 1. 清理函数被调用（timer 被清除）
  // 2. effect 的依赖订阅被移除
}
```

## 运行时警告

如果 `$effect` 在运行时被调用（而不是编译时转换），会收到警告：

```
[Aether] $effect() was called at runtime.
Make sure the Aether compiler plugin is configured.
```

## 底层实现

编译后，`$effect(() => {...})` 转换为：

```js
__effect(() => {...})
```

`__effect` 是 Aether runtime 中的 `Effect` 类：

```js
export class Effect {
  constructor(fn) {
    this._fn = fn
    this._dependencies = new Set()
    this._cleanup = null
    this._active = true
    this.run()  // 立即执行一次
  }

  run() {
    if (!this._active) return
    this._cleanupDeps()
    if (this._cleanup) this._cleanup()

    __pushEffect(this)
    try {
      const result = this._fn()
      if (typeof result === 'function') {
        this._cleanup = result
      }
    } finally {
      __popEffect()
    }
  }

  dispose() {
    this._active = false
    this._cleanupDeps()
    if (this._cleanup) this._cleanup()
  }
}
```

## 注意事项

1. **不要在 effect 中修改自己的追踪依赖**
   ```jsx
   let count = $state(0)

   $effect(() => {
     // 可能导致无限循环！
     count = count + 1
   })
   ```

2. **清理函数应该清理所有副作用**
   ```jsx
   $effect(() => {
     const handler = () => {...}
     window.addEventListener('resize', handler)

     return () => {
       window.removeEventListener('resize', handler)  // 清理监听器
     }
   })
   ```

3. **effect 执行顺序**
   ```jsx
   $effect(() => console.log('Effect 1'))
   $effect(() => console.log('Effect 2'))
   // 初始化时输出: Effect 1, Effect 2
   ```

## 相关 API

- [$state](./$state.md) - 响应式状态
- [$derived](./$derived.md) - 派生计算值
- [$store](./$store.md) - 跨组件全局状态

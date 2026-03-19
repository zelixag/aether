# $state API

声明响应式状态。

## 语法

```typescript
$state<T>(initialValue: T): T
```

## 参数

| 参数 | 类型 | 描述 |
|------|------|------|
| `initialValue` | `T` | 状态的初始值 |

## 返回值

返回一个响应式状态值，其类型与初始值相同。

## 说明

`$state` 是 Aether 响应式系统的核心 API。它声明一个响应式状态变量，当该变量被修改时，所有依赖它的 Derived 计算值和 Effect 副作用都会自动更新。

编译器会自动转换代码：
- 变量声明时转换为 `__signal(initialValue)`
- 读取时自动添加 `.value`（如 `count` -> `count.value`）
- 赋值时自动添加 `.value`（如 `count = 5` -> `count.value = 5`）
- 自增/自减自动处理（如 `count++` -> `count.value++`）

## 类型推导

```typescript
let count = $state(0)       // count 类型为 number
let name = $state('aether') // name 类型为 string
let user = $state({         // user 类型为 { name: string, age: number }
  name: 'Aether',
  age: 1
})
```

## 用法示例

### 基本使用

```jsx
import { $state, mount } from 'aether'

function Counter() {
  let count = $state(0)

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => count++}>Increment</button>
    </div>
  )
}

mount(Counter, '#app')
```

编译后等价于：

```js
function Counter() {
  const count = __signal(0)

  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick={() => count.value++}>Increment</button>
    </div>
  )
}
```

### 多种赋值方式

```jsx
function Counter() {
  let n = $state(0)

  return (
    <div>
      <p>Value: {n}</p>
      <button onClick={() => n = 10}>Set to 10</button>
      <button onClick={() => n++}>Increment</button>
      <button onClick={() => n--}>Decrement</button>
      <button onClick={() => n += 5}>Add 5</button>
    </div>
  )
}
```

### 对象状态

```jsx
function UserProfile() {
  let user = $state({
    name: 'Aether',
    age: 1
  })

  return (
    <div>
      <p>Name: {user.name}</p>
      <p>Age: {user.age}</p>
      <button onClick={() => {
        user.name = 'New Name'
        user.age = 2
      }}>Update</button>
    </div>
  )
}
```

### 数组状态

```jsx
function TodoList() {
  let todos = $state([
    { id: 1, text: 'Learn Aether', done: false },
    { id: 2, text: 'Build something', done: false }
  ])

  return (
    <div>
      {todos.map(todo => (
        <div key={todo.id}>
          <span style={{ textDecoration: todo.done ? 'line-through' : 'none' }}>
            {todo.text}
          </span>
          <button onClick={() => {
            todo.done = !todo.done
          }}>Toggle</button>
        </div>
      ))}
    </div>
  )
}
```

## 注意事项

1. **不要在条件语句中声明 $state**
   ```jsx
   // 错误：$state 在条件中可能导致不一致的行为
   if (condition) {
     let value = $state(0)
   }

   // 正确：始终在组件顶层声明
   function Component() {
     let value = $state(0)
     if (condition) {
       // 可以在这里使用 value
     }
   }
   ```

2. **$state 变量是常量绑定**
   ```jsx
   // 正确：修改变量的 value
   let count = $state(0)
   count++

   // 错误：不能重新赋值变量本身
   let count = $state(0)
   count = $state(10)  // 这会破坏响应式！
   ```

3. **编译器自动处理 .value**
   你编写的代码中**不应该**出现 `.value`。编译器会自动添加。如果你在代码中看到 `.value`，说明编译器可能没有正确工作。

## 运行时警告

如果 `$state` 在运行时被调用（而不是编译时转换），会收到警告：

```
[Aether] $state() was called at runtime.
This usually means the Aether compiler plugin is not configured.
Make sure aether-compiler is added to your build tool.
```

## 底层实现

编译后，`$state(initialValue)` 转换为：

```js
const signal = __signal(initialValue)
```

`__signal` 是 Aether runtime 中的 `Signal` 类实例：

```js
export class Signal {
  constructor(value) {
    this._value = value
    this._subscribers = new Set()
  }

  get value() {
    if (activeEffect) {
      this._subscribers.add(activeEffect)
      activeEffect._dependencies.add(this)
    }
    return this._value
  }

  set value(newValue) {
    if (Object.is(this._value, newValue)) return
    this._value = newValue
    for (const sub of this._subscribers) {
      __scheduleUpdate(sub)
    }
  }
}
```

## 相关 API

- [$derived](./$derived.md) - 派生计算值
- [$effect](./$effect.md) - 副作用
- [$store](./$store.md) - 跨组件全局状态

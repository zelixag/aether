// Aether Counter Example
// 这是用户写的代码——干净、直观、无 .value
import { $state, $derived, $effect, mount } from 'aether'

function Counter() {
  let count = $state(0)
  let double = $derived(() => count * 2)

  $effect(() => {
    console.log(`count changed to ${count}, double is ${double}`)
  })

  function increment() {
    count++
  }

  function decrement() {
    count--
  }

  function reset() {
    count = 0
  }

  return (
    <div class="counter">
      <h1>Aether Counter</h1>
      <p class="count">{count}</p>
      <p class="derived">Double: {double}</p>
      <div class="buttons">
        <button onClick={decrement}>-</button>
        <button onClick={reset}>Reset</button>
        <button onClick={increment}>+</button>
      </div>
      <p class="tagline">Compiled. Reactive. Minimal.</p>
    </div>
  )
}

mount(Counter, '#app')

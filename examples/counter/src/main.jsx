// Aether 完整示例
// 展示所有内置功能：$state, $derived, $effect, $store, $async, $style
// 用户写的代码——干净、直观、无 .value、无 Hooks 规则
import { $state, $derived, $effect, $store, $async, $style, mount } from 'aether'

// ============================================
// $store: 跨组件共享状态——无需 Context、无需 Provider
// ============================================
const appStore = $store({
  theme: 'dark',
  user: 'Aether'
})

// ============================================
// Counter 组件
// ============================================
function Counter() {
  let count = $state(0)
  let double = $derived(() => count * 2)

  // $effect: 自动副作用，组件卸载自动清理
  $effect(() => {
    document.title = `Aether | Count: ${count}`
  })

  // $style: 编译时作用域 CSS，不污染全局
  const s = $style`
    .counter { text-align: center; padding: 2rem; }
    .count { font-size: 4rem; font-weight: 200; margin: 1rem 0; }
    .derived { color: #888; font-size: 1.2rem; }
    .buttons { display: flex; gap: 1rem; justify-content: center; margin: 1.5rem 0; }
    .btn { padding: 0.5rem 1.5rem; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; background: transparent; color: #fff; font-size: 1.1rem; cursor: pointer; transition: all 0.2s; }
    .tagline { color: #555; font-size: 0.9rem; margin-top: 2rem; }
  `

  return (
    <div class="counter">
      <h1>Aether Counter</h1>
      <p class="count">{count}</p>
      <p class="derived">Double: {double}</p>
      <div class="buttons">
        <button class="btn" onClick={() => count--}>-</button>
        <button class="btn" onClick={() => count = 0}>Reset</button>
        <button class="btn" onClick={() => count++}>+</button>
      </div>
      <p class="derived">Theme: {appStore.theme} | User: {appStore.user}</p>
      <p class="tagline">Compiled. Reactive. Minimal.</p>
    </div>
  )
}

mount(Counter, '#app')

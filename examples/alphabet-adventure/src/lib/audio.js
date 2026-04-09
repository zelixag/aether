// 发音工具：Web Speech API + Web Audio 生成的简单音效
// 选择 Web Speech 而非音频文件：零资源开销 + 所有字母都能念

let voicesReady = false
let englishVoice = null

// 初始化语音（浏览器异步加载 voice list）
function initVoices() {
  if (typeof speechSynthesis === 'undefined') return
  const voices = speechSynthesis.getVoices()
  if (voices.length === 0) return
  // 优先挑选清晰的儿童友好英文语音
  const preferred = [
    'Samantha',     // macOS
    'Google US English',
    'Microsoft Zira',
    'Microsoft Aria',
  ]
  for (const name of preferred) {
    const v = voices.find(v => v.name === name || v.name.includes(name))
    if (v) { englishVoice = v; break }
  }
  if (!englishVoice) {
    englishVoice = voices.find(v => v.lang.startsWith('en')) || voices[0]
  }
  voicesReady = true
}

if (typeof speechSynthesis !== 'undefined') {
  speechSynthesis.addEventListener('voiceschanged', initVoices)
  initVoices()
}

// 朗读英文
export function speak(text, { rate = 0.85, pitch = 1.2 } = {}) {
  if (typeof speechSynthesis === 'undefined') return
  try {
    speechSynthesis.cancel()
    const utter = new SpeechSynthesisUtterance(text)
    if (englishVoice) utter.voice = englishVoice
    utter.lang = 'en-US'
    utter.rate = rate
    utter.pitch = pitch
    utter.volume = 1
    speechSynthesis.speak(utter)
  } catch (e) {
    // 静默失败，不影响游戏体验
  }
}

// Web Audio：生成简单的反馈音效（不依赖文件）
let audioCtx = null
function getCtx() {
  if (!audioCtx && typeof AudioContext !== 'undefined') {
    audioCtx = new AudioContext()
  }
  return audioCtx
}

// 正确音效：上扬的双音
export function playSuccess() {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  // 两个音符：C5 → E5 → G5
  ;[523.25, 659.25, 783.99].forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, now + i * 0.1)
    gain.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.02)
    gain.gain.linearRampToValueAtTime(0, now + i * 0.1 + 0.18)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + i * 0.1)
    osc.stop(now + i * 0.1 + 0.2)
  })
}

// 点击音效：温和的"叮"
export function playTap() {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = 880
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.08, now + 0.01)
  gain.gain.linearRampToValueAtTime(0, now + 0.1)
  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.1)
}

// 错误音效：柔和的低音（不要吓到孩子）
export function playTryAgain() {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = 330
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.1, now + 0.02)
  gain.gain.linearRampToValueAtTime(0, now + 0.25)
  osc.connect(gain).connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.3)
}

// 通关音效：欢快的音阶
export function playFanfare() {
  const ctx = getCtx()
  if (!ctx) return
  const now = ctx.currentTime
  // C大调音阶上行
  const notes = [523.25, 587.33, 659.25, 783.99, 1046.50]
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.value = freq
    gain.gain.setValueAtTime(0, now + i * 0.12)
    gain.gain.linearRampToValueAtTime(0.15, now + i * 0.12 + 0.02)
    gain.gain.linearRampToValueAtTime(0, now + i * 0.12 + 0.25)
    osc.connect(gain).connect(ctx.destination)
    osc.start(now + i * 0.12)
    osc.stop(now + i * 0.12 + 0.3)
  })
}

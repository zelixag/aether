// 进度存储：简单的 localStorage 封装
const KEY = 'aether_alphabet_progress'

const DEFAULT = {
  level1: 0,  // 每关已获得的星星数（0-3）
  level2: 0,
  level3: 0,
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT }
  }
}

export function saveProgress(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress))
  } catch {
    // 静默失败
  }
}

export function awardStar(level, stars) {
  const p = loadProgress()
  const key = `level${level}`
  if (stars > p[key]) {
    p[key] = stars
    saveProgress(p)
  }
  return p
}

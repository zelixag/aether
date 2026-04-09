// 进度存储：已解锁的字母数量 + 总星星
// 设计：按 A→Z 顺序解锁，一次只教一个字母，学完一个解锁下一个
const KEY = 'aether_alphabet_progress_v2'

const DEFAULT = {
  unlockedCount: 1,  // 已解锁字母数量（从 1 开始，即 A）
  stars: 0,          // 总星星数
  seenLetters: [],   // 已完整看过的字母索引
}

export function loadProgress() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return { ...DEFAULT }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT, ...parsed, seenLetters: parsed.seenLetters || [] }
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

// 标记字母已学，解锁下一个
export function markLetterSeen(letterIndex) {
  const p = loadProgress()
  if (!p.seenLetters.includes(letterIndex)) {
    p.seenLetters.push(letterIndex)
    p.stars = p.stars + 1
  }
  // 解锁下一个字母（最多到 26）
  if (letterIndex + 1 >= p.unlockedCount && p.unlockedCount < 26) {
    p.unlockedCount = Math.min(p.unlockedCount + 1, 26)
  }
  saveProgress(p)
  return p
}

// 重置进度（调试用）
export function resetProgress() {
  saveProgress({ ...DEFAULT })
  return { ...DEFAULT }
}

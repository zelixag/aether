// 字母数据：每个字母配一个幼儿熟悉的单词和 emoji
export const LETTERS = [
  { upper: 'A', lower: 'a', word: 'Apple',    emoji: '🍎' },
  { upper: 'B', lower: 'b', word: 'Ball',     emoji: '⚽' },
  { upper: 'C', lower: 'c', word: 'Cat',      emoji: '🐱' },
  { upper: 'D', lower: 'd', word: 'Dog',      emoji: '🐶' },
  { upper: 'E', lower: 'e', word: 'Elephant', emoji: '🐘' },
  { upper: 'F', lower: 'f', word: 'Fish',     emoji: '🐟' },
  { upper: 'G', lower: 'g', word: 'Grape',    emoji: '🍇' },
  { upper: 'H', lower: 'h', word: 'Hat',      emoji: '🎩' },
  { upper: 'I', lower: 'i', word: 'Ice',      emoji: '🍦' },
  { upper: 'J', lower: 'j', word: 'Juice',    emoji: '🧃' },
  { upper: 'K', lower: 'k', word: 'Kite',     emoji: '🪁' },
  { upper: 'L', lower: 'l', word: 'Lion',     emoji: '🦁' },
  { upper: 'M', lower: 'm', word: 'Moon',     emoji: '🌙' },
  { upper: 'N', lower: 'n', word: 'Nose',     emoji: '👃' },
  { upper: 'O', lower: 'o', word: 'Orange',   emoji: '🍊' },
  { upper: 'P', lower: 'p', word: 'Pig',      emoji: '🐷' },
  { upper: 'Q', lower: 'q', word: 'Queen',    emoji: '👑' },
  { upper: 'R', lower: 'r', word: 'Rabbit',   emoji: '🐰' },
  { upper: 'S', lower: 's', word: 'Sun',      emoji: '☀️' },
  { upper: 'T', lower: 't', word: 'Tree',     emoji: '🌳' },
  { upper: 'U', lower: 'u', word: 'Umbrella', emoji: '☂️' },
  { upper: 'V', lower: 'v', word: 'Violin',   emoji: '🎻' },
  { upper: 'W', lower: 'w', word: 'Water',    emoji: '💧' },
  { upper: 'X', lower: 'x', word: 'X-ray',    emoji: '🩻' },
  { upper: 'Y', lower: 'y', word: 'Yellow',   emoji: '💛' },
  { upper: 'Z', lower: 'z', word: 'Zebra',    emoji: '🦓' },
]

// 随机从数组取 n 个元素（不重复）
export function sample(arr, n) {
  const copy = [...arr]
  const result = []
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length)
    result.push(copy.splice(idx, 1)[0])
  }
  return result
}

// 打乱数组
export function shuffle(arr) {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

// Design tokens — CSS custom properties (set in index.html)
export const colors = {
  bg: 'var(--c-bg)',
  bgSurface: 'var(--c-bg-surface)',
  bgCard: 'var(--c-bg-card)',
  bgHover: 'var(--c-bg-hover)',
  border: 'var(--c-border)',
  borderLight: 'var(--c-border-light)',
  text: 'var(--c-text)',
  textMuted: 'var(--c-text-muted)',
  textDim: 'var(--c-text-dim)',
  accent: 'var(--c-accent)',
  accentHover: 'var(--c-accent-hover)',
  accentDim: 'var(--c-accent-dim)',
  accentWarm: 'var(--c-accent-warm)',
  accentMuted: 'var(--c-accent-muted)',
  codeBg: 'var(--c-code-bg)',
  codeText: 'var(--c-code-text)',
  navBg: 'var(--c-nav-bg)',
  activeBg: 'var(--c-active-bg)',
  shadow: 'var(--c-shadow)',
  shadowAccent: 'var(--c-shadow-accent)',
}

export const fonts = {
  display: 'var(--font-display)',
  sans: 'var(--font-sans)',
  mono: 'var(--font-mono)',
}

export function getTheme() {
  if (typeof window === 'undefined') return 'light'
  return localStorage.getItem('aether-theme') || 'light'
}

export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('aether-theme', theme)
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light'
  setTheme(current === 'dark' ? 'light' : 'dark')
  return current === 'dark' ? 'light' : 'dark'
}

export function initTheme() {
  setTheme(getTheme())
}

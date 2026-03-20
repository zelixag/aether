// Design tokens — all values reference CSS custom properties
// Theme switching works by toggling [data-theme] on <html>
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
  codeBg: 'var(--c-code-bg)',
  codeText: 'var(--c-code-text)',
  navBg: 'var(--c-nav-bg)',
  activeBg: 'var(--c-active-bg)',
}

export const fonts = {
  sans: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
}

// Theme management
export function getTheme() {
  if (typeof window === 'undefined') return 'dark'
  return localStorage.getItem('aether-theme') || 'dark'
}

export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  localStorage.setItem('aether-theme', theme)
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'dark'
  setTheme(current === 'dark' ? 'light' : 'dark')
  return current === 'dark' ? 'light' : 'dark'
}

// Initialize theme on load
export function initTheme() {
  setTheme(getTheme())
}

import { colors, fonts } from '../styles.js'

export function DocPage({ children }) {
  return (
    <article style={`
      max-width: 720px; padding: 2rem 0 4rem;
      line-height: 1.7;
    `}>
      {children}
    </article>
  )
}

export function H1({ children }) {
  return <h1 style={`
    font-size: 2rem; font-weight: 800; margin-bottom: 1rem;
    letter-spacing: -0.02em; color: ${colors.text};
  `}>{children}</h1>
}

export function H2({ children }) {
  return <h2 style={`
    font-size: 1.4rem; font-weight: 700; margin-top: 2.5rem; margin-bottom: 0.75rem;
    letter-spacing: -0.01em; color: ${colors.text};
    padding-bottom: 0.5rem; border-bottom: 1px solid ${colors.border};
  `}>{children}</h2>
}

export function H3({ children }) {
  return <h3 style={`
    font-size: 1.1rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem;
    color: ${colors.text};
  `}>{children}</h3>
}

export function P({ children }) {
  return <p style={`
    margin-bottom: 1rem; color: ${colors.textMuted};
    font-size: 0.95rem; line-height: 1.7;
  `}>{children}</p>
}

export function Ul({ children }) {
  return <ul style={`
    margin-bottom: 1rem; padding-left: 1.5rem;
    color: ${colors.textMuted}; font-size: 0.95rem;
  `}>{children}</ul>
}

export function Li({ children }) {
  return <li style={`
    margin-bottom: 0.5rem; line-height: 1.6;
  `}>{children}</li>
}

export function Note({ children }) {
  return (
    <div style={`
      margin: 1.5rem 0; padding: 1rem 1.25rem;
      border-left: 3px solid ${colors.accent};
      background: ${colors.accentDim};
      border-radius: 0 8px 8px 0;
      font-size: 0.9rem; color: ${colors.textMuted};
    `}>
      {children}
    </div>
  )
}

import { colors, fonts } from '../styles.js'

export function DocPage({ children }) {
  return (
    <article style={`
      max-width: 740px; line-height: 1.75;
    `}>
      {children}
    </article>
  )
}

export function H1({ children }) {
  return <h1 style={`
    font-size: 2.25rem; font-weight: 800; margin-bottom: 0.5rem;
    letter-spacing: -0.025em; color: ${colors.text};
    line-height: 1.2;
  `}>{children}</h1>
}

export function H2({ children }) {
  return <h2 style={`
    font-size: 1.35rem; font-weight: 700; margin-top: 2.5rem; margin-bottom: 0.75rem;
    letter-spacing: -0.01em; color: ${colors.text};
    padding-bottom: 0.4rem; border-bottom: 1px solid ${colors.border};
  `}>{children}</h2>
}

export function H3({ children }) {
  return <h3 style={`
    font-size: 1.05rem; font-weight: 600; margin-top: 1.5rem; margin-bottom: 0.5rem;
    color: ${colors.text};
  `}>{children}</h3>
}

export function P({ children }) {
  return <p style={`
    margin-bottom: 1rem; color: ${colors.textMuted};
    font-size: 0.925rem; line-height: 1.75;
  `}>{children}</p>
}

export function Ul({ children }) {
  return <ul style={`
    margin-bottom: 1rem; padding-left: 1.25rem;
    color: ${colors.textMuted}; font-size: 0.925rem;
  `}>{children}</ul>
}

export function Li({ children }) {
  return <li style={`
    margin-bottom: 0.4rem; line-height: 1.65;
    padding-left: 0.25rem;
  `}>{children}</li>
}

export function Note({ children }) {
  return (
    <div style={`
      margin: 1.5rem 0; padding: 0.875rem 1.125rem;
      border-left: 3px solid ${colors.accent};
      background: ${colors.accentDim};
      border-radius: 0 6px 6px 0;
      font-size: 0.875rem; color: ${colors.textMuted};
      line-height: 1.65;
    `}>
      {children}
    </div>
  )
}

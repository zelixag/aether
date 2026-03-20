import { colors, fonts } from '../styles.js'

export function CodeBlock({ code, lang = 'jsx', title = '' }) {
  return (
    <div style={`
      margin: 1rem 0; border-radius: 8px; overflow: hidden;
      border: 1px solid ${colors.border};
      background: #111;
    `}>
      {title ? (
        <div style={`
          padding: 0.4rem 1rem;
          font-size: 0.725rem; font-weight: 500;
          color: ${colors.textDim};
          border-bottom: 1px solid ${colors.border};
          font-family: ${fonts.mono};
          background: rgba(255,255,255,0.02);
        `}>{title}</div>
      ) : null}
      <pre style={`
        padding: 0.875rem 1.125rem; margin: 0;
        overflow-x: auto; font-size: 0.8125rem; line-height: 1.65;
        font-family: ${fonts.mono};
        color: #c9d1d9;
        -webkit-overflow-scrolling: touch;
      `}><code>{code}</code></pre>
    </div>
  )
}

export function InlineCode({ children }) {
  return (
    <code style={`
      padding: 0.125rem 0.375rem; border-radius: 4px;
      background: rgba(255,255,255,0.06);
      border: 1px solid ${colors.border};
      font-family: ${fonts.mono};
      font-size: 0.825em; color: ${colors.accent};
    `}>{children}</code>
  )
}

import { colors, fonts } from '../styles.js'

export function CodeBlock({ code, lang = 'jsx', title = '' }) {
  return (
    <div style={`
      margin: 1rem 0; border-radius: 8px; overflow: hidden;
      border: 1px solid ${colors.border};
      background: ${colors.bgSurface};
    `}>
      {title ? (
        <div style={`
          padding: 0.5rem 1rem;
          font-size: 0.75rem; font-weight: 500;
          color: ${colors.textDim};
          border-bottom: 1px solid ${colors.border};
          font-family: ${fonts.mono};
        `}>{title}</div>
      ) : null}
      <pre style={`
        padding: 1rem 1.25rem; margin: 0;
        overflow-x: auto; font-size: 0.85rem; line-height: 1.6;
        font-family: ${fonts.mono};
        color: ${colors.text};
      `}><code>{code}</code></pre>
    </div>
  )
}

export function InlineCode({ children }) {
  return (
    <code style={`
      padding: 0.15rem 0.4rem; border-radius: 4px;
      background: ${colors.bgCard};
      border: 1px solid ${colors.border};
      font-family: ${fonts.mono};
      font-size: 0.85em; color: ${colors.accent};
    `}>{children}</code>
  )
}

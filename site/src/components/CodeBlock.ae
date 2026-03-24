import { colors, fonts } from '../styles.js'

export function CodeBlock({ code, lang = 'jsx', title = '' }) {
  return (
    <div style={`
      margin: 1.25rem 0; border-radius: 16px; overflow: hidden;
      border: 1px solid ${colors.border};
      background: ${colors.codeBg};
      box-shadow: 4px 4px 0 ${colors.shadow};
    `}>
      {title ? (
        <div style={`
          padding: 0.5rem 1.125rem;
          font-size: 0.6875rem; font-weight: 700;
          color: ${colors.accent};
          text-transform: uppercase; letter-spacing: 0.1em;
          border-bottom: 1px dashed ${colors.border};
          font-family: ${fonts.mono};
        `}>{title}</div>
      ) : null}
      <pre style={`
        padding: 1rem 1.25rem; margin: 0;
        overflow-x: auto; font-size: 0.8125rem; line-height: 1.7;
        font-family: ${fonts.mono};
        color: ${colors.codeText};
        -webkit-overflow-scrolling: touch;
      `}><code>{code}</code></pre>
    </div>
  )
}

export function InlineCode({ children }) {
  return (
    <code style={`
      padding: 0.15rem 0.4rem; border-radius: 5px;
      background: ${colors.activeBg};
      border: 1px solid ${colors.border};
      font-family: ${fonts.mono};
      font-size: 0.825em; color: ${colors.accent};
      font-weight: 500;
    `}>{children}</code>
  )
}

import { $style } from 'aether'

export function CodeBlock({ code, language = 'javascript', filename }) {
  const s = $style`
    .code-block {
      position: relative;
      margin: 1.5rem 0;
      border-radius: var(--radius-lg);
      overflow: hidden;
      box-shadow: var(--shadow-lg);
    }

    .code-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: var(--color-ink-light);
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .code-filename {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--color-cream);
      opacity: 0.7;
    }

    .code-language {
      font-family: var(--font-mono);
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-accent-warm);
      background: rgba(255, 255, 255, 0.1);
      padding: 0.25rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .code-content {
      overflow-x: auto;
    }

    .code-content pre {
      margin: 0;
      border-radius: 0;
      box-shadow: none;
    }
  `

  return (
    <div class={s.codeBlock}>
      <div class={s.codeHeader}>
        {filename ? (
          <span class={s.codeFilename}>{filename}</span>
        ) : (
          <span></span>
        )}
        <span class={s.codeLanguage}>{language}</span>
      </div>
      <div class={s.codeContent}>
        <pre><code class={`language-${language}`}>{code}</code></pre>
      </div>
    </div>
  )
}

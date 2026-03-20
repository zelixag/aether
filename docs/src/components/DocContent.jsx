import { $style } from 'aether'

export function DocContent({ title, description, children }) {
  const s = $style`
    .doc {
      max-width: 100%;
    }

    .doc-header {
      margin-bottom: 3rem;
      padding-bottom: 2rem;
      border-bottom: 2px solid var(--color-ink);
    }

    .doc-title {
      font-family: var(--font-display);
      font-size: clamp(2.5rem, 5vw, 3.5rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.1;
      margin-bottom: 1rem;
      color: var(--color-ink);
    }

    .doc-description {
      font-size: 1.1875rem;
      color: var(--color-ink-light);
      line-height: 1.65;
      max-width: 600px;
    }

    .doc-body h2 {
      font-family: var(--font-display);
      font-size: 1.75rem;
      font-weight: 700;
      margin-top: 3rem;
      margin-bottom: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
    }

    .doc-body h3 {
      font-family: var(--font-display);
      font-size: 1.375rem;
      font-weight: 700;
      margin-top: 2rem;
      margin-bottom: 0.75rem;
      color: var(--color-ink);
    }

    .doc-body h4 {
      font-family: var(--font-sans);
      font-size: 1.0625rem;
      font-weight: 700;
      margin-top: 1.5rem;
      margin-bottom: 0.5rem;
      color: var(--color-ink);
    }

    .doc-body p {
      font-size: 1rem;
      line-height: 1.75;
      color: var(--color-ink-light);
      margin-bottom: 1.25rem;
    }

    .doc-body ul,
    .doc-body ol {
      margin-bottom: 1.25rem;
      padding-left: 1.5rem;
      color: var(--color-ink-light);
    }

    .doc-body li {
      margin-bottom: 0.5rem;
      line-height: 1.7;
    }

    .doc-body a {
      color: var(--color-accent);
      text-decoration: underline;
      text-decoration-color: var(--color-accent-muted);
      text-underline-offset: 2px;
      transition: all var(--transition-fast);
    }

    .doc-body a:hover {
      color: var(--color-accent-warm);
      text-decoration-color: var(--color-accent-warm);
    }

    .doc-body strong {
      font-weight: 700;
      color: var(--color-ink);
    }

    .doc-body code {
      font-family: var(--font-mono);
      font-size: 0.875em;
      background: var(--color-bg-warm);
      padding: 0.125em 0.375em;
      border-radius: var(--radius-sm);
      color: var(--color-accent);
    }

    .doc-body pre code {
      background: transparent;
      padding: 0;
      color: inherit;
    }

    .doc-body table {
      width: 100%;
      margin: 1.5rem 0;
      border-collapse: collapse;
      font-size: 0.9375rem;
    }

    .doc-body th,
    .doc-body td {
      padding: 0.75rem 1rem;
      text-align: left;
      border: 1px solid var(--color-border);
    }

    .doc-body th {
      background: var(--color-bg-warm);
      font-weight: 700;
      color: var(--color-ink);
    }

    .doc-body tr:nth-child(even) {
      background: var(--color-cream);
    }

    .doc-body blockquote {
      margin: 1.5rem 0;
      padding: 1rem 1.5rem;
      border-left: 4px solid var(--color-accent);
      background: var(--color-cream);
      border-radius: 0 var(--radius-md) var(--radius-md) 0;
    }

    .doc-body blockquote p {
      margin-bottom: 0;
      font-style: italic;
    }

    .doc-body hr {
      margin: 2rem 0;
      border: none;
      height: 2px;
      background: var(--color-border);
    }

    .doc-body img {
      max-width: 100%;
      height: auto;
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-md);
    }
  `

  return (
    <article class={s.doc}>
      <header class={s.docHeader}>
        <h1 class={s.docTitle}>{title}</h1>
        {description && <p class={s.docDescription}>{description}</p>}
      </header>
      <div class={s.docBody}>
        {children}
      </div>
    </article>
  )
}

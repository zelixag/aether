import { $style } from 'aether'

export function TableOfContents({ items }) {
  const s = $style`
    .toc {
      position: sticky;
      top: 100px;
      padding: 1.5rem;
      background: var(--color-cream);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-sm);
      max-height: calc(100vh - 200px);
      overflow-y: auto;
    }

    .toc-title {
      font-family: var(--font-sans);
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-ink-light);
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--color-border);
    }

    .toc-list {
      list-style: none;
    }

    .toc-item {
      margin-bottom: 0.5rem;
    }

    .toc-link {
      display: block;
      font-size: 0.8125rem;
      color: var(--color-ink-light);
      text-decoration: none;
      padding: 0.25rem 0;
      border-left: 2px solid transparent;
      transition: all var(--transition-fast);
    }

    .toc-link:hover {
      color: var(--color-ink);
      border-left-color: var(--color-accent);
    }

    .toc-link.active {
      color: var(--color-accent);
      font-weight: 600;
      border-left-color: var(--color-accent);
    }
  `

  if (!items || items.length === 0) {
    return null
  }

  return (
    <nav class={s.toc}>
      <h4 class={s.tocTitle}>On This Page</h4>
      <ul class={s.tocList}>
        {items.map(item => (
          <li key={item.id} class={s.tocItem}>
            <a href={`#${item.id}`} class={s.tocLink}>
              {item.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}

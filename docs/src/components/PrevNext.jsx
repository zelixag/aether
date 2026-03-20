import { $style } from 'aether'

export function PrevNext({ prev, next }) {
  const s = $style`
    .prev-next {
      display: flex;
      justify-content: space-between;
      gap: 1.5rem;
      margin-top: 4rem;
      padding-top: 2rem;
      border-top: 2px solid var(--color-ink);
    }

    .prev-next-link {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1.25rem 1.5rem;
      background: var(--color-cream);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      text-decoration: none;
      transition: all var(--transition-normal);
      box-shadow: var(--shadow-sm);
    }

    .prev-next-link:hover {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: var(--color-accent);
    }

    .prev-next-link.next {
      text-align: right;
      margin-left: auto;
    }

    .prev-next-label {
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-ink-light);
    }

    .prev-next-title {
      font-family: var(--font-display);
      font-size: 1.0625rem;
      font-weight: 600;
      color: var(--color-ink);
      transition: color var(--transition-fast);
    }

    .prev-next-link:hover .prev-next-title {
      color: var(--color-accent);
    }

    @media (max-width: 600px) {
      .prev-next {
        flex-direction: column;
      }

      .prev-next-link.next {
        text-align: left;
        margin-left: 0;
      }
    }
  `

  return (
    <div class={s.prevNext}>
      {prev ? (
        <a href={prev.path} class={s.prevNextLink}>
          <span class={s.prevNextLabel}>Previous</span>
          <span class={s.prevNextTitle}>{prev.title}</span>
        </a>
      ) : <div />}

      {next ? (
        <a href={next.path} class={`${s.prevNextLink} ${s.next}`}>
          <span class={s.prevNextLabel}>Next</span>
          <span class={s.prevNextTitle}>{next.title}</span>
        </a>
      ) : <div />}
    </div>
  )
}

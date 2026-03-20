import { $state, $derived, $effect, $style, mount, Button } from 'aether'
import { Layout } from '../components/Layout.jsx'

function HomePage() {
  let count = $state(0)
  let doubled = $derived(() => count * 2)

  const s = $style`
    .hero {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
      padding: 4rem 0;
    }

    .hero-content {
      max-width: 540px;
    }

    .title {
      font-family: var(--font-display);
      font-size: clamp(3rem, 6vw, 4.5rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.05;
      margin-bottom: 1.75rem;
    }

    .accent {
      color: var(--color-accent);
      font-style: italic;
    }

    .subtitle {
      font-size: 1.1875rem;
      color: var(--color-ink-light);
      line-height: 1.65;
      margin-bottom: 2.5rem;
    }

    .cta {
      display: flex;
      gap: 1rem;
    }

    .counter-display {
      background: var(--color-cream);
      border: 1px solid var(--color-border);
      border-radius: 24px;
      padding: 3rem;
      box-shadow: var(--shadow-lg);
    }

    .counter-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-ink-light);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.5rem;
    }

    .count {
      font-family: var(--font-display);
      font-size: clamp(5rem, 10vw, 8rem);
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 0.9;
      color: var(--color-ink);
    }

    .derived {
      font-size: 1rem;
      color: var(--color-accent-warm);
      margin-top: 1rem;
      font-family: var(--font-mono);
    }

    .counter-controls {
      display: flex;
      gap: 0.875rem;
      justify-content: center;
      margin-top: 2rem;
    }

    @media (max-width: 900px) {
      .hero {
        grid-template-columns: 1fr;
        gap: 2rem;
        padding: 2rem 0;
      }
    }
  `

  return (
    <Layout currentPath="/">
      <section class={s.hero}>
        <div class={s.heroContent}>
          <h1 class={s.title}>Build faster with <span class={s.accent}>Aether</span></h1>
          <p class={s.subtitle}>
            100% TypeScript. No virtual DOM. No hooks rules. Just pure reactive magic that compiles to vanilla JavaScript.
          </p>
          <div class={s.cta}>
            <a href="/guide/getting-started"><Button variant="primary" size="lg">Get Started</Button></a>
            <a href="/api/$state"><Button variant="secondary" size="lg">View API</Button></a>
          </div>
        </div>

        <div class={s.counterDisplay}>
          <p class={s.counterLabel}>Current Count</p>
          <p class={s.count}>{count}</p>
          <p class={s.derived}>double = {doubled}</p>
          <div class={s.counterControls}>
            <Button variant="secondary" size="sm" onClick={() => count--}>-</Button>
            <Button variant="ghost" onClick={() => count = 0}>Reset</Button>
            <Button variant="primary" size="sm" onClick={() => count++}>+</Button>
          </div>
        </div>
      </section>
    </Layout>
  )
}

mount(HomePage, '#docs-root')

// Aether Counter Demo - Warm Editorial Brutalism
import { $state, $derived, $effect, $store, $style, mount, Button, Input, Card, CardHeader, CardBody, CardFooter } from 'aether'

const appStore = $store({
  theme: 'dark',
  user: 'Developer'
})

function Counter() {
  let count = $state(0)
  let double = $derived(() => count * 2)

  $effect(() => {
    document.title = `Count: ${count} | Aether`
  })

  const s = $style`
    /* === CSS Variables === */
    :root {
      --color-bg: #f5f0e8;
      --color-bg-warm: #ebe4d8;
      --color-ink: #1a1612;
      --color-ink-light: #4a453d;
      --color-accent: #c45d35;
      --color-accent-warm: #e8845f;
      --color-accent-muted: #d4a574;
      --color-cream: #faf7f2;
      --color-border: #d4cfc4;
      --font-display: 'Playfair Display', Georgia, serif;
      --font-sans: 'DM Sans', -apple-system, sans-serif;
      --font-mono: 'JetBrains Mono', monospace;
    }

    /* === Reset & Base === */
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .app {
      min-height: 100vh;
      background: var(--color-bg);
      color: var(--color-ink);
      font-family: var(--font-sans);
      position: relative;
      overflow-x: hidden;
    }

    /* === Film Grain Overlay === */
    .app::before {
      content: '';
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
      opacity: 0.03;
      pointer-events: none;
      z-index: 1000;
    }

    /* === Navigation === */
    .nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem 3rem;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-cream);
    }

    .nav-logo {
      display: flex;
      align-items: center;
      gap: 1rem;
      text-decoration: none;
      color: var(--color-ink);
    }

    .nav-logo-mark {
      width: 48px;
      height: 48px;
      background: var(--color-ink);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 1.5rem;
      color: var(--color-bg);
      transform: rotate(-3deg);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .nav-logo:hover .nav-logo-mark {
      transform: rotate(0deg) scale(1.05);
    }

    .nav-logo-text {
      font-size: 1.25rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .nav-right {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .nav-links {
      display: flex;
      gap: 2.5rem;
    }

    .nav-link {
      color: var(--color-ink-light);
      text-decoration: none;
      font-size: 0.9375rem;
      font-weight: 500;
      transition: color 0.2s;
      position: relative;
    }

    .nav-link::after {
      content: '';
      position: absolute;
      bottom: -4px;
      left: 0;
      width: 0;
      height: 2px;
      background: var(--color-accent);
      transition: width 0.3s ease;
    }

    .nav-link:hover {
      color: var(--color-ink);
    }

    .nav-link:hover::after {
      width: 100%;
    }

    .nav-badge {
      background: var(--color-accent);
      padding: 0.375rem 0.875rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
      letter-spacing: 0.02em;
    }

    /* === Main Container === */
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 3rem 6rem;
    }

    /* === Hero Section === */
    .hero {
      padding: 6rem 0 5rem;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4rem;
      align-items: center;
    }

    .hero-content {
      max-width: 540px;
    }

    .hero-eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.625rem;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-accent);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 1.5rem;
    }

    .hero-eyebrow-line {
      width: 32px;
      height: 2px;
      background: var(--color-accent);
    }

    .hero h1 {
      font-family: var(--font-display);
      font-size: clamp(3rem, 6vw, 4.5rem);
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.05;
      margin-bottom: 1.75rem;
      color: var(--color-ink);
    }

    .hero h1 span {
      color: var(--color-accent);
      font-style: italic;
    }

    .hero-subtitle {
      font-size: 1.1875rem;
      color: var(--color-ink-light);
      max-width: 480px;
      line-height: 1.65;
      margin-bottom: 2.5rem;
    }

    .hero-cta {
      display: flex;
      gap: 1rem;
    }

    /* === Counter Display === */
    .hero-visual {
      position: relative;
    }

    .counter-display {
      background: var(--color-cream);
      border: 1px solid var(--color-border);
      border-radius: 24px;
      padding: 3.5rem;
      position: relative;
      box-shadow:
        8px 8px 0 var(--color-border),
        16px 16px 0 rgba(196, 93, 53, 0.1);
    }

    .counter-display::before {
      content: 'COUNTER';
      position: absolute;
      top: -12px;
      left: 32px;
      background: var(--color-bg);
      padding: 0 12px;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      color: var(--color-ink-light);
    }

    .counter-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--color-ink-light);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.75rem;
    }

    .count {
      font-family: var(--font-display);
      font-size: clamp(6rem, 12vw, 9rem);
      font-weight: 700;
      letter-spacing: -0.04em;
      line-height: 0.9;
      color: var(--color-ink);
      position: relative;
      display: inline-block;
    }

    .count::after {
      content: '';
      position: absolute;
      bottom: 0.1em;
      left: 0;
      right: 0;
      height: 0.08em;
      background: var(--color-accent);
      transform: scaleX(0);
      transform-origin: left;
      animation: underline-in 0.6s ease forwards;
      animation-delay: 0.3s;
    }

    @keyframes underline-in {
      to { transform: scaleX(1); }
    }

    .derived {
      font-size: 1.0625rem;
      color: var(--color-accent-warm);
      margin-top: 1.25rem;
      font-weight: 500;
      font-family: var(--font-mono);
    }

    .derived span {
      color: var(--color-ink-light);
    }

    .counter-controls {
      display: flex;
      gap: 0.875rem;
      justify-content: center;
      margin-top: 2.5rem;
    }

    /* === Decorative Elements === */
    .hero-decoration {
      position: absolute;
      right: -60px;
      top: 50%;
      transform: translateY(-50%);
      width: 200px;
      height: 200px;
      opacity: 0.15;
    }

    .hero-decoration circle {
      fill: none;
      stroke: var(--color-accent);
      stroke-width: 1;
    }

    /* === Features Grid === */
    .features {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
      margin-bottom: 5rem;
    }

    .feature-card {
      background: var(--color-cream);
      border: 1px solid var(--color-border);
      border-radius: 20px;
      padding: 2.25rem;
      position: relative;
      transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
    }

    .feature-card:nth-child(2) {
      transform: translateY(1.5rem);
    }

    .feature-card:hover {
      transform: translateY(-0.5rem);
      box-shadow:
        0 20px 40px rgba(26, 22, 18, 0.08),
        0 0 0 1px var(--color-accent);
    }

    .feature-card:nth-child(2):hover {
      transform: translateY(1rem);
    }

    .feature-number {
      font-family: var(--font-display);
      font-size: 3.5rem;
      font-weight: 700;
      color: var(--color-border);
      position: absolute;
      top: 1rem;
      right: 1.5rem;
      line-height: 1;
    }

    .feature-icon {
      width: 56px;
      height: 56px;
      background: var(--color-bg);
      border: 1px solid var(--color-border);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
      transition: all 0.3s ease;
    }

    .feature-card:hover .feature-icon {
      background: var(--color-accent);
      border-color: var(--color-accent);
      transform: rotate(-5deg) scale(1.05);
    }

    .feature-card h3 {
      font-family: var(--font-display);
      font-size: 1.375rem;
      font-weight: 700;
      margin-bottom: 0.625rem;
      color: var(--color-ink);
    }

    .feature-card p {
      font-size: 0.9375rem;
      color: var(--color-ink-light);
      line-height: 1.6;
    }

    /* === Components Section === */
    .section {
      margin-bottom: 5rem;
    }

    .section-header {
      margin-bottom: 3rem;
      padding-bottom: 1.5rem;
      border-bottom: 2px solid var(--color-ink);
    }

    .section-title {
      font-family: var(--font-display);
      font-size: 2.25rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 0.5rem;
    }

    .section-subtitle {
      font-size: 1rem;
      color: var(--color-ink-light);
    }

    /* === Button Showcase === */
    .button-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .button-card {
      background: var(--color-cream);
      border: 1px solid var(--color-border);
      border-radius: 20px;
      padding: 2rem;
    }

    .button-card-title {
      font-size: 0.6875rem;
      font-weight: 700;
      color: var(--color-accent);
      text-transform: uppercase;
      letter-spacing: 0.15em;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px dashed var(--color-border);
    }

    .button-row {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-bottom: 1rem;
    }

    .button-row:last-child {
      margin-bottom: 0;
    }

    /* === Input Demo === */
    .input-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }

    .input-card {
      background: var(--color-cream);
      border: 1px solid var(--color-border);
      border-radius: 20px;
      padding: 1.75rem;
    }

    .input-label {
      display: block;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--color-ink-light);
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 0.75rem;
    }

    /* === Aether Input Styles === */
    .aether-input {
      width: 100%;
      padding: 1rem 1.125rem;
      background: var(--color-bg);
      border: 2px solid transparent;
      border-radius: 12px;
      color: var(--color-ink);
      font-size: 0.9375rem;
      font-family: inherit;
      transition: all 0.25s ease;
    }

    .aether-input::placeholder {
      color: var(--color-ink-light);
      opacity: 0.6;
    }

    .aether-input:focus {
      outline: none;
      border-color: var(--color-accent);
      background: var(--color-cream);
      box-shadow: 4px 4px 0 var(--color-accent-muted);
    }

    .aether-input:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background: var(--color-border);
    }

    /* === Card Styles === */
    .aether-card {
      background: var(--color-cream);
      border: 1px solid var(--color-border);
      border-radius: 20px;
      overflow: hidden;
    }

    .aether-card-header {
      padding: 1.75rem 2rem;
      border-bottom: 1px solid var(--color-border);
      background: var(--color-bg-warm);
    }

    .aether-card-title {
      font-family: var(--font-display);
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--color-ink);
      margin: 0;
    }

    .aether-card-subtitle {
      font-size: 0.875rem;
      color: var(--color-ink-light);
      margin: 0.25rem 0 0;
    }

    .aether-card-body {
      padding: 2rem;
    }

    .aether-card-footer {
      padding: 1.5rem 2rem;
      border-top: 1px solid var(--color-border);
      display: flex;
      gap: 0.875rem;
      background: var(--color-bg);
    }

    /* === Button Styles Override === */
    .aether-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      border: 2px solid transparent;
      border-radius: 10px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: inherit;
    }

    .aether-btn--primary {
      background: var(--color-accent);
      color: white;
      border-color: var(--color-accent);
      box-shadow: 4px 4px 0 var(--color-accent-muted);
    }

    .aether-btn--primary:hover:not(:disabled) {
      transform: translate(-2px, -2px);
      box-shadow: 6px 6px 0 var(--color-accent-muted);
    }

    .aether-btn--primary:active:not(:disabled) {
      transform: translate(2px, 2px);
      box-shadow: 2px 2px 0 var(--color-accent-muted);
    }

    .aether-btn--secondary {
      background: var(--color-cream);
      color: var(--color-ink);
      border-color: var(--color-ink);
    }

    .aether-btn--secondary:hover:not(:disabled) {
      background: var(--color-ink);
      color: var(--color-cream);
      transform: translate(-2px, -2px);
      box-shadow: 4px 4px 0 var(--color-border);
    }

    .aether-btn--ghost {
      background: transparent;
      color: var(--color-ink-light);
      border-color: transparent;
    }

    .aether-btn--ghost:hover:not(:disabled) {
      color: var(--color-ink);
      background: rgba(26, 22, 18, 0.05);
    }

    .aether-btn--sm {
      padding: 0.625rem 1.125rem;
      font-size: 0.875rem;
      border-radius: 8px;
    }

    .aether-btn--lg {
      padding: 1.125rem 2rem;
      font-size: 1rem;
      border-radius: 12px;
    }

    .aether-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
      transform: none !important;
    }

    /* === Footer === */
    .footer {
      background: var(--color-ink);
      padding: 3.5rem;
      margin-top: 4rem;
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 1.5rem;
    }

    .footer-text {
      font-size: 0.9375rem;
      color: var(--color-cream);
      opacity: 0.7;
    }

    .footer-text span {
      color: var(--color-accent-warm);
      font-weight: 600;
    }

    .footer-links {
      display: flex;
      gap: 2.5rem;
    }

    .footer-link {
      font-size: 0.9375rem;
      color: var(--color-cream);
      opacity: 0.7;
      text-decoration: none;
      transition: all 0.2s;
    }

    .footer-link:hover {
      opacity: 1;
      color: var(--color-accent-warm);
    }

    /* === Responsive === */
    @media (max-width: 900px) {
      .hero {
        grid-template-columns: 1fr;
        gap: 3rem;
        padding: 4rem 0 3rem;
      }

      .hero-visual {
        order: -1;
      }

      .features {
        grid-template-columns: 1fr;
      }

      .feature-card:nth-child(2) {
        transform: none;
      }

      .button-grid {
        grid-template-columns: 1fr;
      }

      .input-grid {
        grid-template-columns: 1fr;
      }

      .nav {
        padding: 1.25rem 1.5rem;
      }

      .nav-links {
        display: none;
      }

      .container {
        padding: 0 1.5rem 4rem;
      }
    }
  `

  return (
    <div class="app">
      {/* Navigation */}
      <nav class="nav">
        <a href="#" class="nav-logo">
          <div class="nav-logo-mark">Æ</div>
          <span class="nav-logo-text">Aether</span>
        </a>
        <div class="nav-right">
          <div class="nav-links">
            <a href="#" class="nav-link">Docs</a>
            <a href="#" class="nav-link">Examples</a>
            <a href="#" class="nav-link">GitHub</a>
          </div>
          <span class="nav-badge">v0.2</span>
        </div>
      </nav>

      <div class="container">
        {/* Hero */}
        <section class="hero">
          <div class="hero-content">
            <div class="hero-eyebrow">
              <span class="hero-eyebrow-line"></span>
              Compile-time Reactive
            </div>
            <h1>Build faster with <span>Aether</span></h1>
            <p class="hero-subtitle">
              100% TypeScript. No virtual DOM. No hooks rules. Just pure reactive magic that compiles to vanilla JavaScript.
            </p>
            <div class="hero-cta">
              <Button variant="primary" size="lg">Get Started</Button>
              <Button variant="secondary" size="lg">View Examples</Button>
            </div>
          </div>

          <div class="hero-visual">
            <div class="counter-display">
              <p class="counter-label">Current Count</p>
              <p class="count">{count}</p>
              <p class="derived"><span>double =</span> {double}</p>
              <div class="counter-controls">
                <Button variant="secondary" size="sm" onClick={() => count--}>−</Button>
                <Button variant="ghost" onClick={() => count = 0}>Reset</Button>
                <Button variant="primary" size="sm" onClick={() => count++}>+</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <div class="features">
          <div class="feature-card">
            <span class="feature-number">01</span>
            <div class="feature-icon">⚡</div>
            <h3>Lightning Fast</h3>
            <p>No virtual DOM diffing. Direct DOM operations with compile-time optimizations.</p>
          </div>
          <div class="feature-card">
            <span class="feature-number">02</span>
            <div class="feature-icon">🎯</div>
            <h3>Type Safe</h3>
            <p>100% TypeScript throughout. Full IDE support with zero runtime overhead.</p>
          </div>
          <div class="feature-card">
            <span class="feature-number">03</span>
            <div class="feature-icon">✨</div>
            <h3>Magic Macros</h3>
            <p>$state, $derived, $effect. Write reactive code that looks like regular code.</p>
          </div>
        </div>

        {/* Button Variants */}
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">Button Component</h2>
            <p class="section-subtitle">Multiple variants for every use case</p>
          </div>

          <div class="button-grid">
            <div class="button-card">
              <p class="button-card-title">Primary</p>
              <div class="button-row">
                <Button variant="primary">Primary</Button>
                <Button variant="primary" size="sm">Small</Button>
              </div>
              <div class="button-row">
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>

            <div class="button-card">
              <p class="button-card-title">Secondary</p>
              <div class="button-row">
                <Button variant="secondary">Secondary</Button>
                <Button variant="secondary" size="sm">Small</Button>
              </div>
              <div class="button-row">
                <Button variant="secondary" disabled>Disabled</Button>
              </div>
            </div>

            <div class="button-card">
              <p class="button-card-title">Ghost</p>
              <div class="button-row">
                <Button variant="ghost">Ghost</Button>
                <Button variant="ghost" size="sm">Small</Button>
              </div>
              <div class="button-row">
                <Button variant="ghost" disabled>Disabled</Button>
              </div>
            </div>
          </div>
        </section>

        {/* Input Demo */}
        <section class="section">
          <div class="section-header">
            <h2 class="section-title">Input Component</h2>
            <p class="section-subtitle">Clean, minimal inputs with focus states</p>
          </div>

          <Card>
            <CardHeader title="Contact Form" subtitle="Example of controlled inputs" />
            <CardBody>
              <div class="input-grid">
                <div class="input-card">
                  <label class="input-label">Full Name</label>
                  <Input type="text" placeholder="John Doe" />
                </div>
                <div class="input-card">
                  <label class="input-label">Email</label>
                  <Input type="text" placeholder="john@example.com" />
                </div>
                <div class="input-card">
                  <label class="input-label">Age</label>
                  <Input type="number" placeholder="25" />
                </div>
                <div class="input-card">
                  <label class="input-label">Password</label>
                  <Input type="password" placeholder="••••••••" />
                </div>
              </div>
            </CardBody>
            <CardFooter>
              <Button variant="primary" size="sm">Submit</Button>
              <Button variant="ghost" size="sm">Cancel</Button>
            </CardFooter>
          </Card>
        </section>
      </div>

      {/* Footer */}
      <footer class="footer">
        <div class="footer-content">
          <p class="footer-text">Built with <span>Aether</span> • {appStore.user}</p>
          <div class="footer-links">
            <a href="#" class="footer-link">Documentation</a>
            <a href="#" class="footer-link">API Reference</a>
            <a href="#" class="footer-link">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  )
}

mount(Counter, '#app')

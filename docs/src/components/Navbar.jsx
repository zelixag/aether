import { $style } from 'aether'

export function Navbar() {
  const s = $style`
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem 2rem;
      background: var(--color-cream);
      border-bottom: 1px solid var(--color-border);
      backdrop-filter: blur(8px);
    }

    .navbar-logo {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      text-decoration: none;
      color: var(--color-ink);
      transition: transform var(--transition-normal);
    }

    .navbar-logo:hover {
      transform: scale(1.02);
    }

    .navbar-logo-mark {
      width: 40px;
      height: 40px;
      background: var(--color-ink);
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 1.25rem;
      color: var(--color-bg);
      transform: rotate(-3deg);
      transition: transform var(--transition-normal);
    }

    .navbar-logo:hover .navbar-logo-mark {
      transform: rotate(0deg);
    }

    .navbar-logo-text {
      font-size: 1.125rem;
      font-weight: 600;
      letter-spacing: -0.02em;
    }

    .navbar-links {
      display: flex;
      align-items: center;
      gap: 2rem;
    }

    .navbar-link {
      position: relative;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--color-ink-light);
      text-decoration: none;
      transition: color var(--transition-fast);
      padding: 0.5rem 0;
    }

    .navbar-link::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      width: 0;
      height: 2px;
      background: var(--color-accent);
      transition: width var(--transition-normal);
    }

    .navbar-link:hover {
      color: var(--color-ink);
    }

    .navbar-link:hover::after {
      width: 100%;
    }

    .navbar-badge {
      background: var(--color-accent);
      padding: 0.25rem 0.75rem;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      color: white;
      letter-spacing: 0.02em;
    }

    .navbar-github {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--color-ink-light);
      text-decoration: none;
      transition: color var(--transition-fast);
    }

    .navbar-github:hover {
      color: var(--color-ink);
    }

    .navbar-github-icon {
      width: 20px;
      height: 20px;
    }

    @media (max-width: 768px) {
      .navbar {
        padding: 0.75rem 1rem;
      }

      .navbar-links {
        gap: 1rem;
      }

      .navbar-link-text {
        display: none;
      }
    }
  `

  return (
    <nav class={s.navbar}>
      <a href="/" class={s.navbarLogo}>
        <div class={s.navbarLogoMark}>A</div>
        <span class={s.navbarLogoText}>Aether</span>
      </a>

      <div class={s.navbarLinks}>
        <a href="/guide/getting-started" class={s.navbarLink}>Docs</a>
        <a href="/api/$state" class={s.navbarLink}>API</a>
        <a href="/examples/counter" class={s.navbarLink}>Examples</a>
        <a href="https://github.com/zelixag/aether" class={s.navbarGithub} target="_blank" rel="noopener">
          <svg class={s.navbarGithubIcon} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          <span class={s.navbarLinkText}>GitHub</span>
        </a>
        <span class={s.navbarBadge}>v0.2</span>
      </div>
    </nav>
  )
}

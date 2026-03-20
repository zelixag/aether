import { $style } from 'aether'

export function Sidebar({ items, currentPath = '/' }) {
  const s = $style`
    .sidebar {
      width: 280px;
      min-width: 280px;
      height: calc(100vh - 65px);
      position: sticky;
      top: 65px;
      overflow-y: auto;
      padding: 2rem 1.5rem;
      background: var(--color-cream);
      border-right: 1px solid var(--color-border);
    }

    .sidebar-section {
      margin-bottom: 2rem;
    }

    .sidebar-section-title {
      font-family: var(--font-sans);
      font-size: 0.6875rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--color-ink-light);
      margin-bottom: 0.75rem;
      padding-left: 0.75rem;
    }

    .sidebar-list {
      list-style: none;
    }

    .sidebar-item {
      margin-bottom: 0.25rem;
    }

    .sidebar-link {
      display: block;
      padding: 0.5rem 0.75rem;
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--color-ink-light);
      text-decoration: none;
      border-radius: var(--radius-md);
      border-left: 2px solid transparent;
      transition: all var(--transition-fast);
    }

    .sidebar-link:hover {
      color: var(--color-ink);
      background: var(--color-bg);
    }

    .sidebar-link.active {
      color: var(--color-accent);
      background: var(--color-bg);
      border-left-color: var(--color-accent);
      font-weight: 600;
    }

    .sidebar-children {
      list-style: none;
      margin-left: 1rem;
      margin-top: 0.25rem;
      border-left: 1px solid var(--color-border);
      padding-left: 0.75rem;
    }

    .sidebar-child-link {
      display: block;
      padding: 0.375rem 0.75rem;
      font-size: 0.875rem;
      color: var(--color-ink-light);
      text-decoration: none;
      border-radius: var(--radius-sm);
      transition: all var(--transition-fast);
    }

    .sidebar-child-link:hover {
      color: var(--color-ink);
      background: var(--color-bg);
    }

    .sidebar-child-link.active {
      color: var(--color-accent);
      font-weight: 600;
    }

    @media (max-width: 900px) {
      .sidebar {
        display: none;
      }
    }
  `

  function isActive(path) {
    return currentPath === path || currentPath.startsWith(path + '/')
  }

  function renderItem(item) {
    if (item.children) {
      return (
        <li class={s.sidebarItem}>
          {item.path ? (
            <a href={item.path} class={`${s.sidebarLink} ${isActive(item.path) ? s.active : ''}`}>
              {item.title}
            </a>
          ) : (
            <span class={s.sidebarLink}>{item.title}</span>
          )}
          <ul class={s.sidebarChildren}>
            {item.children.map(child => (
              <li key={child.path}>
                <a
                  href={child.path}
                  class={`${s.sidebarChildLink} ${isActive(child.path || '') ? s.active : ''}`}
                >
                  {child.title}
                </a>
              </li>
            ))}
          </ul>
        </li>
      )
    }

    return (
      <li class={s.sidebarItem}>
        <a
          href={item.path}
          class={`${s.sidebarLink} ${isActive(item.path || '') ? s.active : ''}`}
        >
          {item.title}
        </a>
      </li>
    )
  }

  return (
    <aside class={s.sidebar}>
      {items.map(section => (
        <div key={section.title} class={s.sidebarSection}>
          <h3 class={s.sidebarSectionTitle}>{section.title}</h3>
          <ul class={s.sidebarList}>
            {section.children
              ? section.children.map(child => renderItem(child))
              : renderItem(section)}
          </ul>
        </div>
      ))}
    </aside>
  )
}

// Default navigation structure
export const defaultNavItems = [
  {
    title: 'Guide',
    children: [
      { title: 'Getting Started', path: '/guide/getting-started' },
      { title: 'Concepts', path: '/guide/concepts' },
    ]
  },
  {
    title: 'API',
    children: [
      { title: '$state', path: '/api/$state' },
      { title: '$derived', path: '/api/$derived' },
      { title: '$effect', path: '/api/$effect' },
      { title: '$store', path: '/api/$store' },
      { title: '$async', path: '/api/$async' },
      { title: '$style', path: '/api/$style' },
      { title: 'mount', path: '/api/mount' },
      { title: 'Router', path: '/api/router' },
    ]
  },
  {
    title: 'Examples',
    children: [
      { title: 'Counter', path: '/examples/counter' },
    ]
  },
  {
    title: 'Resources',
    children: [
      { title: 'Architecture', path: '/architecture' },
      { title: 'Performance', path: '/performance' },
    ]
  }
]

import { $state } from 'aether'
import { colors, fonts } from '../styles.js'

export function Navbar({ onNavigate, currentRoute }) {
  let mobileOpen = $state(false)

  const navLinks = [
    { label: 'Guide', path: '/guide/getting-started' },
    { label: 'API', path: '/api/state' },
    { label: 'Architecture', path: '/architecture' },
  ]

  const isActive = (path) => currentRoute.startsWith(path.split('/').slice(0, 3).join('/'))

  return (
    <header style={`
      position: sticky; top: 0; z-index: 100;
      background: rgba(10, 10, 10, 0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid ${colors.border};
      padding: 0 1.5rem; height: 60px;
      display: flex; align-items: center; justify-content: space-between;
    `}>
      <div style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer"
           onClick={() => onNavigate('/')}>
        <img src="/aether/logo.svg" alt="Aether" style="width: 32px; height: 32px; border-radius: 6px" />
        <span style={`font-size: 1.2rem; font-weight: 700; color: ${colors.text}; letter-spacing: -0.02em`}>
          Aether
        </span>
        <span style={`
          font-size: 0.7rem; padding: 2px 6px; border-radius: 4px;
          background: ${colors.accentDim}; color: ${colors.accent};
          font-weight: 500;
        `}>v0.1</span>
      </div>

      <nav style="display: flex; align-items: center; gap: 0.25rem">
        {navLinks.map(link => (
          <a onClick={() => onNavigate(link.path)}
             style={`
               padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer;
               font-size: 0.875rem; font-weight: 500; transition: all 0.15s;
               text-decoration: none;
               color: ${isActive(link.path) ? colors.accent : colors.textMuted};
               background: ${isActive(link.path) ? colors.accentDim : 'transparent'};
             `}>
            {link.label}
          </a>
        ))}
        <a href="https://github.com/zelixag/aether"
           target="_blank"
           style={`
             padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer;
             font-size: 0.875rem; font-weight: 500; text-decoration: none;
             color: ${colors.textMuted};
           `}>
          GitHub
        </a>
      </nav>
    </header>
  )
}

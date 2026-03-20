import { $state } from 'aether'
import { colors } from '../styles.js'

export function Navbar({ onNavigate, currentRoute }) {
  const navLinks = [
    { label: 'Guide', path: '/guide/getting-started' },
    { label: 'API', path: '/api/state' },
    { label: 'Architecture', path: '/architecture' },
  ]

  const isActive = (path) => {
    if (path === '/architecture') return currentRoute === '/architecture'
    return currentRoute.startsWith(path.split('/').slice(0, 3).join('/'))
  }

  return (
    <header style={`
      position: sticky; top: 0; z-index: 100;
      background: rgba(10, 10, 10, 0.88);
      backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px);
      border-bottom: 1px solid ${colors.border};
      height: 56px;
    `}>
      <div style="max-width: 1280px; margin: 0 auto; padding: 0 1.5rem; height: 100%; display: flex; align-items: center; justify-content: space-between">
        <div style="display: flex; align-items: center; gap: 0.6rem; cursor: pointer"
             onClick={() => onNavigate('/')}>
          <img src="/aether/logo.svg" alt="Aether" style="width: 28px; height: 28px; border-radius: 6px" />
          <span style={`font-size: 1.1rem; font-weight: 700; color: ${colors.text}; letter-spacing: -0.02em`}>
            Aether
          </span>
          <span style={`
            font-size: 0.65rem; padding: 1px 5px; border-radius: 4px;
            background: ${colors.accentDim}; color: ${colors.accent};
            font-weight: 600; letter-spacing: 0.02em;
          `}>v0.1</span>
        </div>

        <nav style="display: flex; align-items: center; gap: 0.125rem">
          {navLinks.map(link => (
            <a onClick={() => onNavigate(link.path)}
               style={`
                 padding: 0.375rem 0.7rem; border-radius: 6px; cursor: pointer;
                 font-size: 0.8125rem; font-weight: 500; transition: all 0.15s;
                 text-decoration: none;
                 color: ${isActive(link.path) ? colors.text : colors.textMuted};
                 background: ${isActive(link.path) ? 'rgba(255,255,255,0.06)' : 'transparent'};
               `}>
              {link.label}
            </a>
          ))}
          <div style="width: 1px; height: 16px; background: #333; margin: 0 0.375rem"></div>
          <a href="https://github.com/zelixag/aether"
             target="_blank"
             style={`
               padding: 0.375rem 0.7rem; border-radius: 6px; cursor: pointer;
               font-size: 0.8125rem; font-weight: 500; text-decoration: none;
               color: ${colors.textMuted};
             `}>
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}

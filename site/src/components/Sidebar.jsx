import { colors, fonts } from '../styles.js'

const sections = [
  {
    title: 'Guide',
    items: [
      { label: 'Getting Started', path: '/guide/getting-started' },
      { label: 'Core Concepts', path: '/guide/concepts' },
    ]
  },
  {
    title: 'API Reference',
    items: [
      { label: '$state', path: '/api/state' },
      { label: '$derived', path: '/api/derived' },
      { label: '$effect', path: '/api/effect' },
      { label: '$store', path: '/api/store' },
      { label: 'mount', path: '/api/mount' },
      { label: 'Router', path: '/api/router' },
    ]
  },
  {
    title: 'Deep Dive',
    items: [
      { label: 'Architecture', path: '/architecture' },
    ]
  }
]

export function Sidebar({ onNavigate, currentRoute }) {
  return (
    <aside style={`
      width: 220px; min-width: 220px;
      border-right: 1px solid ${colors.border};
      padding: 1.5rem 0;
      height: calc(100vh - 60px);
      position: sticky; top: 60px;
      overflow-y: auto;
      background: ${colors.bgSurface};
    `}>
      {sections.map(section => (
        <div style="margin-bottom: 1.5rem">
          <div style={`
            padding: 0 1.25rem; margin-bottom: 0.5rem;
            font-size: 0.6875rem; font-weight: 700;
            text-transform: uppercase; letter-spacing: 0.15em;
            color: ${colors.accent};
          `}>
            {section.title}
          </div>
          {section.items.map(item => (
            <a onClick={() => onNavigate(item.path)}
               style={`
                 display: block; padding: 0.375rem 1.25rem;
                 font-size: 0.875rem; cursor: pointer;
                 text-decoration: none; transition: all 0.15s;
                 color: ${currentRoute === item.path ? colors.text : colors.textMuted};
                 background: ${currentRoute === item.path ? colors.activeBg : 'transparent'};
                 font-weight: ${currentRoute === item.path ? '600' : '400'};
                 border-left: 2px solid ${currentRoute === item.path ? colors.accent : 'transparent'};
               `}>
              {item.label}
            </a>
          ))}
        </div>
      ))}
    </aside>
  )
}

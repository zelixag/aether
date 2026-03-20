import { colors } from '../styles.js'

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
      padding: 1.25rem 0;
      height: calc(100vh - 56px);
      position: sticky; top: 56px;
      overflow-y: auto;
    `}>
      {sections.map(section => (
        <div style="margin-bottom: 1.25rem">
          <div style={`
            padding: 0 1rem; margin-bottom: 0.4rem;
            font-size: 0.675rem; font-weight: 600;
            text-transform: uppercase; letter-spacing: 0.08em;
            color: ${colors.textDim};
          `}>
            {section.title}
          </div>
          {section.items.map(item => (
            <a onClick={() => onNavigate(item.path)}
               style={`
                 display: block; padding: 0.3rem 1rem;
                 font-size: 0.825rem; cursor: pointer;
                 text-decoration: none; transition: all 0.1s;
                 border-left: 2px solid ${currentRoute === item.path ? colors.accent : 'transparent'};
                 color: ${currentRoute === item.path ? colors.text : colors.textMuted};
                 background: ${currentRoute === item.path ? 'rgba(255,255,255,0.03)' : 'transparent'};
                 font-weight: ${currentRoute === item.path ? '500' : '400'};
               `}>
              {item.label}
            </a>
          ))}
        </div>
      ))}
    </aside>
  )
}

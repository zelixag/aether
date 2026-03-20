// This import ensures Aether compiler transforms this file
import 'aether'

export function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ flex: 1, padding: '2rem' }}>{children}</div>
    </div>
  )
}

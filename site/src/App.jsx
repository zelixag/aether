import { $state, $derived } from 'aether'
import { Navbar } from './components/Navbar.jsx'
import { Sidebar } from './components/Sidebar.jsx'
import { Home } from './pages/Home.jsx'
import { GettingStarted } from './pages/GettingStarted.jsx'
import { Concepts } from './pages/Concepts.jsx'
import { ApiState } from './pages/ApiState.jsx'
import { ApiDerived } from './pages/ApiDerived.jsx'
import { ApiEffect } from './pages/ApiEffect.jsx'
import { ApiStore } from './pages/ApiStore.jsx'
import { ApiMount } from './pages/ApiMount.jsx'
import { ApiRouter } from './pages/ApiRouter.jsx'
import { Architecture } from './pages/Architecture.jsx'
import { colors } from './styles.js'

// Simple hash router
function getRoute() {
  const hash = window.location.hash.slice(1) || '/'
  return hash
}

export function App() {
  let route = $state(getRoute())

  window.addEventListener('hashchange', () => {
    route = getRoute()
  })

  let isHome = $derived(() => route === '/')
  let showSidebar = $derived(() => !isHome)

  const navigateTo = (path) => {
    window.location.hash = path
  }

  return (
    <div style="min-height: 100vh; display: flex; flex-direction: column">
      <Navbar onNavigate={navigateTo} currentRoute={route} />
      <div style={`display: flex; flex: 1; ${showSidebar ? '' : ''}`}>
        {showSidebar ? <Sidebar onNavigate={navigateTo} currentRoute={route} /> : null}
        <main style={`flex: 1; ${showSidebar ? 'padding: 2rem 3rem; max-width: 900px;' : ''}`}>
          {route === '/' ? <Home onNavigate={navigateTo} /> : null}
          {route === '/guide/getting-started' ? <GettingStarted /> : null}
          {route === '/guide/concepts' ? <Concepts /> : null}
          {route === '/api/state' ? <ApiState /> : null}
          {route === '/api/derived' ? <ApiDerived /> : null}
          {route === '/api/effect' ? <ApiEffect /> : null}
          {route === '/api/store' ? <ApiStore /> : null}
          {route === '/api/mount' ? <ApiMount /> : null}
          {route === '/api/router' ? <ApiRouter /> : null}
          {route === '/architecture' ? <Architecture /> : null}
        </main>
      </div>
    </div>
  )
}

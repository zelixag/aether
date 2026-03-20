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

function getRoute() {
  const hash = window.location.hash.slice(1) || '/'
  return hash
}

export function App() {
  let route = $state(getRoute())

  window.addEventListener('hashchange', () => {
    route = getRoute()
    window.scrollTo(0, 0)
  })

  let isHome = $derived(() => route === '/')

  const navigateTo = (path) => {
    window.location.hash = path
  }

  return (
    <div style="min-height: 100vh; display: flex; flex-direction: column; background: #0a0a0a">
      <Navbar onNavigate={navigateTo} currentRoute={route} />
      {isHome
        ? <Home onNavigate={navigateTo} />
        : <div style="display: flex; flex: 1; max-width: 1280px; margin: 0 auto; width: 100%">
            <Sidebar onNavigate={navigateTo} currentRoute={route} />
            <main style="flex: 1; min-width: 0; padding: 2.5rem 3rem 4rem">
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
      }
    </div>
  )
}

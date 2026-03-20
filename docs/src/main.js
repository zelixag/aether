// Aether Docs - Main Entry
// This file handles client-side routing and initial page load

import './styles/global.css'

// Base path for GitHub Pages deployment
const BASE_PATH = '/aether'

// Simple hash-based router
function router() {
  // Remove base path from pathname for routing
  const path = window.location.pathname.replace(BASE_PATH, '') || '/'
  const root = document.getElementById('docs-root')

  if (!root) return

  // Clear loading state
  root.innerHTML = ''

  // Route to appropriate page component
  if (path === '/' || path === '') {
    import('./pages/index.jsx').then(m => {
      // The page module handles its own mount
    }).catch(err => {
      console.error('Failed to load home page:', err)
      root.innerHTML = '<div style="padding: 2rem; color: red;">Failed to load page</div>'
    })
  } else if (path.startsWith('/guide/')) {
    import('./pages/guide/getting-started.jsx').then(m => {
      // The page module handles its own mount
    }).catch(err => {
      console.error('Failed to load guide page:', err)
      root.innerHTML = '<div style="padding: 2rem; color: red;">Failed to load page</div>'
    })
  } else {
    // 404
    root.innerHTML = `
      <div style="padding: 4rem; text-align: center;">
        <h1 style="font-size: 4rem; margin-bottom: 1rem;">404</h1>
        <p style="color: #4a453d; margin-bottom: 2rem;">Page not found</p>
        <a href="/" style="color: #c45d35;">Go Home</a>
      </div>
    `
  }

  // Initialize Prism after content loads
  if (window.Prism) {
    setTimeout(() => window.Prism.highlightAll(), 100)
  }
}

// Handle navigation
document.addEventListener('click', (e) => {
  const link = e.target.closest('a')
  if (!link) return

  const href = link.getAttribute('href')
  if (!href || href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) return

  e.preventDefault()
  const fullPath = href === '/' ? BASE_PATH + '/' : BASE_PATH + href
  window.history.pushState({}, '', fullPath)
  router()
})

// Handle back/forward
window.addEventListener('popstate', router)

// Initial route
router()

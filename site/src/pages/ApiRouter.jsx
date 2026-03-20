import { CodeBlock, InlineCode } from '../components/CodeBlock.jsx'
import { DocPage, H1, H2, P, Note } from '../components/DocPage.jsx'

export function ApiRouter() {
  return (
    <DocPage>
      <H1>Router</H1>
      <P>Aether includes a built-in signal-based router. No external packages needed.</P>

      <H2>API</H2>
      <CodeBlock code={`import { navigate, Link, __router } from 'aether'

// Programmatic navigation
navigate('/about')

// Declarative link component
<Link href="/about">About</Link>

// Access current route info
__routePath   // current path
__routeParams // dynamic params
__routeQuery  // query string params`} />

      <H2>Usage</H2>
      <CodeBlock code={`import { $derived, navigate } from 'aether'

function App() {
  let page = $derived(() => {
    const path = window.location.pathname
    if (path === '/') return 'home'
    if (path === '/about') return 'about'
    return 'notfound'
  })

  return (
    <div>
      <nav>
        <a onClick={() => navigate('/')}>Home</a>
        <a onClick={() => navigate('/about')}>About</a>
      </nav>
      {page === 'home' ? <Home /> : null}
      {page === 'about' ? <About /> : null}
    </div>
  )
}`} />

      <Note>The router uses signals internally, so route changes trigger fine-grained DOM updates — only the parts that depend on the route re-render.</Note>
    </DocPage>
  )
}

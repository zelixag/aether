import { $state, $derived, $effect, $style, mount } from 'aether'
import { Layout } from '../../components/Layout.jsx'
import { DocContent } from '../../components/DocContent.jsx'
import { CodeBlock } from '../../components/CodeBlock.jsx'
import { Callout } from '../../components/Callout.jsx'
import { PrevNext } from '../../components/PrevNext.jsx'

function GettingStartedPage() {
  const s = $style`
    .page {
      padding: 2rem 0;
    }
  `

  return (
    <Layout currentPath="/guide/getting-started">
      <div class={s.page}>
        <DocContent
          title="Getting Started"
          description="Build your first Aether application in minutes. Aether is a compile-time reactive framework that transforms JSX and reactive macros into vanilla JavaScript."
        >
          <h2 id="installation">Installation</h2>
          <p>Get started with Aether by installing the core packages:</p>
          <CodeBlock
            language="bash"
            code={`npm install aether-compiler aether-runtime`}
          />

          <h2 id="quick-start">Quick Start</h2>
          <p>Create your first Aether component with reactive state:</p>
          <CodeBlock
            language="jsx"
            code={`import { $state, $derived, $effect, mount } from 'aether'

function Counter() {
  let count = $state(0)
  let doubled = $derived(() => count * 2)

  $effect(() => {
    document.title = \`Count: \${count}\`
  })

  return (
    <div>
      <p>Count: {count}</p>
      <p>Doubled: {doubled}</p>
      <button onClick={() => count++}>Increment</button>
    </div>
  )
}

mount(Counter, '#app')`}
          />

          <Callout type="tip" title="How it works">
            <p>$state, $derived, and $effect are compile-time macros that transform into efficient vanilla JavaScript at build time. No virtual DOM, no runtime overhead.</p>
          </Callout>

          <h2 id="reactive-macros">Reactive Macros</h2>
          <p>Aether provides four core reactive macros:</p>
          <ul>
            <li><code>$state</code> - Create reactive state</li>
            <li><code>$derived</code> - Create computed values</li>
            <li><code>$effect</code> - Create side effects</li>
            <li><code>$store</code> - Create shared state</li>
          </ul>

          <h2 id="jsx">JSX Transformation</h2>
          <p>Aether transforms JSX into efficient DOM operations:</p>
          <CodeBlock
            language="jsx"
            code={`// Your JSX
<div class="container">
  <h1>{title}</h1>
  <button onClick={handleClick}>Click me</button>
</div>

// Becomes (simplified)
__createElement('div', { class: 'container' },
  __createElement('h1', __bindText(() => title)),
  __createElement('button', { onClick: handleClick }, 'Click me')
)`}
          />

          <h2 id="next-steps">Next Steps</h2>
          <p>Learn more about Aether's core concepts:</p>
          <ul>
            <li><a href="/guide/concepts">Core Concepts</a> - Understand signals, effects, and reactivity</li>
            <li><a href="/api/$state">$state API</a> - Deep dive into state management</li>
            <li><a href="/api/$effect">$effect API</a> - Learn about side effects</li>
          </ul>

          <PrevNext
            prev={{ title: 'Introduction', path: '/' }}
            next={{ title: 'Concepts', path: '/guide/concepts' }}
          />
        </DocContent>
      </div>
    </Layout>
  )
}

mount(GettingStartedPage, '#docs-root')

import { $state, $derived, $effect, $style, mount } from 'aether'
import { Layout } from '../components/Layout'
import { DocContent } from '../components/DocContent'
import { CodeBlock } from '../components/CodeBlock'
import { Callout } from '../components/Callout'
import { PrevNext } from '../components/PrevNext'

function ConceptsPage() {
  const s = $style`
    .page {
      padding: 2rem 0;
    }
  `

  return (
    <Layout currentPath="/guide/concepts">
      <div class={s.page}>
        <DocContent
          title="Core Concepts"
          description="Understand the fundamental ideas behind Aether's compile-time reactivity system."
        >
          <h2 id="signals">Signals</h2>
          <p>Signals are the core primitive of Aether's reactivity system. They hold a value and automatically track dependencies:</p>
          <CodeBlock
            language="jsx"
            code={`let count = $state(0)

// Reading count.value triggers dependency tracking
// Writing count.value triggers updates`}
          />

          <h2 id="derived">Derived Values</h2>
          <p>Derived values automatically recompute when their dependencies change:</p>
          <CodeBlock
            language="jsx"
            code={`let firstName = $state('John')
let lastName = $state('Doe')

// Automatically updates when firstName or lastName changes
let fullName = $derived(() => \`\${firstName} \${lastName}\`)`}
          />

          <Callout type="info" title="Caching">
            <p>Derived values are cached. They only recompute when their dependencies actually change.</p>
          </Callout>

          <h2 id="effects">Effects</h2>
          <p>Effects run side effects when their dependencies change:</p>
          <CodeBlock
            language="jsx"
            code={`let title = $state('Hello')

// Runs whenever title changes
$effect(() => {
  document.title = title
})`}
          />

          <h2 id="cleanup">Automatic Cleanup</h2>
          <p>Effects automatically clean up when they re-run or when the component unmounts:</p>
          <CodeBlock
            language="jsx"
            code={`$effect(() => {
  const timer = setInterval(() => count++, 1000)

  // Cleanup function - runs before the effect re-runs
  return () => clearInterval(timer)
})`}
          />

          <h2 id="batching">Batching Updates</h2>
          <p>Aether automatically batches updates to avoid unnecessary re-renders:</p>
          <CodeBlock
            language="jsx"
            code={`// Multiple state changes only trigger one update
$effect(() => {
  firstName = 'Jane'  // No re-run yet
  lastName = 'Smith'  // No re-run yet
}) // Re-runs once here`}
          />

          <h2 id="comparison">Comparison with Other Frameworks</h2>
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>Aether</th>
                <th>React</th>
                <th>Vue</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Virtual DOM</td>
                <td>❌ No</td>
                <td>✅ Yes</td>
                <td>✅ Yes</td>
              </tr>
              <tr>
                <td>Compile-time</td>
                <td>✅ Yes</td>
                <td>❌ No</td>
                <td>❌ No</td>
              </tr>
              <tr>
                <td>Automatic cleanup</td>
                <td>✅ Yes</td>
                <td>⚠️ Manual</td>
                <td>✅ Yes</td>
              </tr>
              <tr>
                <td>Bundle size</td>
                <td>&lt;5KB</td>
                <td>~45KB</td>
                <td>~33KB</td>
              </tr>
            </tbody>
          </table>

          <PrevNext
            prev={{ title: 'Getting Started', path: '/guide/getting-started' }}
            next={{ title: '$state API', path: '/api/$state' }}
          />
        </DocContent>
      </div>
    </Layout>
  )
}

mount(ConceptsPage, '#docs-root')

import { $state, $derived, $effect, $style, mount } from 'aether'
import { Layout } from '../../components/Layout'
import { DocContent } from '../../components/DocContent'
import { CodeBlock } from '../../components/CodeBlock'
import { Callout } from '../../components/Callout'
import { PrevNext } from '../../components/PrevNext'

function ApiStatePage() {
  const s = $style`
    .page {
      padding: 2rem 0;
    }
  `

  return (
    <Layout currentPath="/api/$state">
      <div class={s.page}>
        <DocContent
          title="$state"
          description="Create reactive state that automatically tracks dependencies and triggers updates."
        >
          <h2 id="syntax">Syntax</h2>
          <CodeBlock
            language="typescript"
            code={`$state<T>(initialValue: T): Signal<T>`}
          />

          <h2 id="description">Description</h2>
          <p>
            $state creates a reactive signal that holds a value. When the value is read,
            Aether automatically tracks it as a dependency. When the value changes,
            all effects and derived values that depend on it are automatically updated.
          </p>

          <Callout type="info" title="Compile-time transformation">
            <p>$state is a compile-time macro that transforms into __signal(initialValue) at build time.</p>
          </Callout>

          <h2 id="examples">Examples</h2>

          <h3 id="basic-usage">Basic Usage</h3>
          <CodeBlock
            language="jsx"
            code={`let count = $state(0)

// Reading triggers dependency tracking
console.log(count) // 0

// Writing triggers updates
count = 1 // All dependent effects/derivations will re-run`}
          />

          <h3 id="objects">Object State</h3>
          <CodeBlock
            language="jsx"
            code={`let user = $state({ name: 'John', age: 30 })

// Objects work seamlessly
user.name = 'Jane' // Triggers updates
console.log(user.name) // 'Jane'`}
          />

          <h3 id="arrays">Array State</h3>
          <CodeBlock
            language="jsx"
            code={`let items = $state([1, 2, 3])

// Arrays are reactive too
items.push(4) // Triggers updates
items = [...items, 5] // Reassignment also works`}
          />

          <h2 id="comparison">Comparison</h2>
          <table>
            <thead>
              <tr>
                <th>Feature</th>
                <th>$state</th>
                <th>React useState</th>
                <th>Vue ref</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Syntax</td>
                <td>let x = $state(0)</td>
                <td>const [x, setX] = useState(0)</td>
                <td>const x = ref(0)</td>
              </tr>
              <tr>
                <td>No .value needed</td>
                <td>✅ Yes</td>
                <td>❌ No</td>
                <td>❌ No</td>
              </tr>
              <tr>
                <td>Type inference</td>
                <td>✅ Full</td>
                <td>⚠️ Partial</td>
                <td>✅ Full</td>
              </tr>
              <tr>
                <td>Bundle impact</td>
                <td>~0KB</td>
                <td>~4KB</td>
                <td>~10KB</td>
              </tr>
            </tbody>
          </table>

          <h2 id="see-also">See Also</h2>
          <ul>
            <li><a href="/api/$derived">$derived</a> - Create computed values</li>
            <li><a href="/api/$effect">$effect</a> - Create side effects</li>
            <li><a href="/guide/concepts">Core Concepts</a> - Understand reactivity</li>
          </ul>

          <PrevNext
            prev={{ title: 'Concepts', path: '/guide/concepts' }}
            next={{ title: '$derived', path: '/api/$derived' }}
          />
        </DocContent>
      </div>
    </Layout>
  )
}

mount(ApiStatePage, '#docs-root')

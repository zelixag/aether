import { CodeBlock, InlineCode } from '../components/CodeBlock.jsx'
import { DocPage, H1, H2, H3, P, Ul, Li } from '../components/DocPage.jsx'

export function Concepts() {
  return (
    <DocPage>
      <H1>Core Concepts</H1>

      <H2>Signals, Not State Hooks</H2>
      <P>In Aether, reactive state is declared with <InlineCode>$state</InlineCode>. Unlike React hooks, there are no rules about ordering or conditional usage. A signal is just a variable.</P>
      <CodeBlock code={`// This is valid — use state anywhere
let name = $state('world')

if (someCondition) {
  let extra = $state(0)  // No problem
}`} />

      <H2>Read/Write Transparency</H2>
      <P>You read and write state variables directly. No <InlineCode>.value</InlineCode>, no <InlineCode>setState()</InlineCode>, no <InlineCode>signal()</InlineCode> calls.</P>
      <CodeBlock code={`let count = $state(0)

// Read — just use the variable
console.log(count)  // 0

// Write — just assign
count = 5
count++
count += 10`} />

      <H2>Derived Values</H2>
      <P><InlineCode>$derived</InlineCode> creates a cached computed value. Dependencies are automatically tracked — no dependency arrays.</P>
      <CodeBlock code={`let firstName = $state('John')
let lastName = $state('Doe')
let fullName = $derived(() => \`\${firstName} \${lastName}\`)

// fullName re-computes only when firstName or lastName changes
// Multiple reads return the cached value`} />

      <H2>Effects</H2>
      <P><InlineCode>$effect</InlineCode> runs side effects and automatically cleans up when the component unmounts.</P>
      <CodeBlock code={`$effect(() => {
  const timer = setInterval(() => count++, 1000)
  // Return cleanup function
  return () => clearInterval(timer)
})`} />

      <H2>Fine-grained DOM Updates</H2>
      <P>When a signal changes, only the exact DOM node that uses it gets updated. No re-rendering of the entire component tree.</P>
      <CodeBlock code={`function App() {
  let a = $state(1)
  let b = $state(2)

  return (
    <div>
      <span>{a}</span>   {/* Only this updates when a changes */}
      <span>{b}</span>   {/* Only this updates when b changes */}
    </div>
  )
}`} />

      <H2>No Virtual DOM</H2>
      <P>Aether compiles JSX into direct DOM operations at build time. There is no virtual DOM, no diffing algorithm, no reconciliation. Each signal has a direct subscription to the DOM nodes it affects.</P>
    </DocPage>
  )
}

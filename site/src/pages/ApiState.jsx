import { $state } from 'aether'
import { CodeBlock, InlineCode } from '../components/CodeBlock.jsx'
import { DocPage, H1, H2, P, Note } from '../components/DocPage.jsx'

export function ApiState() {
  // Live demo
  let demo = $state(0)

  return (
    <DocPage>
      <H1>$state</H1>
      <P>Declares a reactive state variable. The compiler transforms reads and writes to signal operations at build time.</P>

      <H2>Syntax</H2>
      <CodeBlock code={`let variableName = $state(initialValue)`} />

      <H2>Parameters</H2>
      <P><InlineCode>initialValue</InlineCode> — The initial value of the state. Can be any type: number, string, object, array, etc.</P>

      <H2>Usage</H2>
      <CodeBlock code={`import { $state } from 'aether'

// Primitive
let count = $state(0)
count++          // triggers update
count = 10       // triggers update

// Object
let user = $state({ name: 'Alice', age: 25 })
user = { ...user, age: 26 }  // triggers update

// Array
let items = $state([1, 2, 3])
items = [...items, 4]  // triggers update`} />

      <H2>Live Demo</H2>
      <div style="margin: 1rem 0; padding: 1.5rem; border: 1px solid #2a2a2a; border-radius: 8px; background: #141414; text-align: center">
        <div style="font-size: 2rem; font-weight: 700; color: #c45d35; margin-bottom: 1rem">{demo}</div>
        <div style="display: flex; gap: 0.5rem; justify-content: center">
          <button onClick={() => demo--} style="padding: 0.4rem 1rem; border-radius: 6px; border: 1px solid #333; background: #1a1a1a; color: #e5e5e5; cursor: pointer">-1</button>
          <button onClick={() => demo = 0} style="padding: 0.4rem 1rem; border-radius: 6px; border: 1px solid #333; background: #1a1a1a; color: #e5e5e5; cursor: pointer">Reset</button>
          <button onClick={() => demo++} style="padding: 0.4rem 1rem; border-radius: 6px; border: none; background: #c45d35; color: white; cursor: pointer">+1</button>
        </div>
      </div>

      <H2>Compilation</H2>
      <CodeBlock code={`// Source
let count = $state(0)
console.log(count)
count++

// Compiled output
let count = __signal(0)
console.log(count.value)
count.value++`} title="Before → After" />

      <Note>
        <strong>Important:</strong> <InlineCode>$state</InlineCode> must be used with <InlineCode>let</InlineCode>, not <InlineCode>const</InlineCode>, since the variable will be reassigned.
      </Note>
    </DocPage>
  )
}

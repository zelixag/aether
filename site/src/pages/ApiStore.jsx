import { CodeBlock, InlineCode } from '../components/CodeBlock.jsx'
import { DocPage, H1, H2, P, Note } from '../components/DocPage.jsx'

export function ApiStore() {
  return (
    <DocPage>
      <H1>$store</H1>
      <P>Creates a reactive store for cross-component state management. Each property becomes an independent signal, enabling fine-grained updates.</P>

      <H2>Syntax</H2>
      <CodeBlock code={`let store = $store({
  key1: initialValue1,
  key2: initialValue2,
})`} />

      <H2>Usage</H2>
      <CodeBlock code={`import { $store } from 'aether'

// Define a global store
let userStore = $store({
  name: 'Alice',
  age: 25,
  theme: 'dark'
})

// Read — direct property access
console.log(userStore.name)  // 'Alice'

// Write — direct assignment
userStore.name = 'Bob'    // only name subscribers update
userStore.age = 26        // only age subscribers update`} />

      <H2>Cross-Component Sharing</H2>
      <CodeBlock code={`// store.js
import { $store } from 'aether'
export let appStore = $store({ count: 0 })

// ComponentA.jsx
import { appStore } from './store.js'
function ComponentA() {
  return <button onClick={() => appStore.count++}>
    Add
  </button>
}

// ComponentB.jsx
import { appStore } from './store.js'
function ComponentB() {
  return <p>Count: {appStore.count}</p>  // auto-updates
}`} />

      <H2>Compilation</H2>
      <CodeBlock code={`// Source
let store = $store({ count: 0, name: 'Alice' })

// Compiled output (Proxy with per-property signals)
let store = __store({ count: 0, name: 'Alice' })`} title="Before → After" />

      <Note>Each property in a store is an independent signal. Updating <InlineCode>store.name</InlineCode> does not trigger subscribers of <InlineCode>store.count</InlineCode>.</Note>
    </DocPage>
  )
}

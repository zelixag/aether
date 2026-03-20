import { CodeBlock, InlineCode } from '../components/CodeBlock.jsx'
import { DocPage, H1, H2, P, Note } from '../components/DocPage.jsx'

export function ApiMount() {
  return (
    <DocPage>
      <H1>mount</H1>
      <P>Mounts an Aether component to a DOM container. This is the entry point for every Aether application.</P>

      <H2>Syntax</H2>
      <CodeBlock code={`import { mount } from 'aether'

mount(componentFn, container)`} />

      <H2>Parameters</H2>
      <P><InlineCode>componentFn</InlineCode> — A function that returns DOM nodes (your root component).</P>
      <P><InlineCode>container</InlineCode> — A CSS selector string or DOM element to mount into.</P>

      <H2>Usage</H2>
      <CodeBlock code={`import { mount } from 'aether'

function App() {
  return <h1>Hello, Aether!</h1>
}

// Mount with CSS selector
mount(App, '#app')

// Mount with DOM element
mount(App, document.getElementById('app'))

// The return value has an unmount method
const instance = mount(App, '#app')
instance.unmount()  // cleanup and remove`} />

      <H2>HMR Support</H2>
      <P>Mount supports Hot Module Replacement out of the box. When a component is updated during development, only the changed parts re-render without losing state.</P>

      <CodeBlock code={`// mount() returns an HMR-aware instance
const instance = mount(App, '#app', 'my-app')

// Vite HMR integration (handled automatically by the Vite plugin)
if (import.meta.hot) {
  import.meta.hot.accept()
}`} />
    </DocPage>
  )
}

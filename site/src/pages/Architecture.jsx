import { CodeBlock, InlineCode } from '../components/CodeBlock.jsx'
import { DocPage, H1, H2, H3, P, Ul, Li, Note } from '../components/DocPage.jsx'

export function Architecture() {
  return (
    <DocPage>
      <H1>Architecture</H1>
      <P>Aether's core principle: move as much work as possible from runtime to compile time.</P>

      <H2>Two-Phase Design</H2>
      <P>Aether operates in two distinct phases:</P>

      <H3>1. Compile Time (Babel Plugin)</H3>
      <Ul>
        <Li>Identify macro imports from 'aether' (<InlineCode>$state</InlineCode>, <InlineCode>$derived</InlineCode>, etc.)</Li>
        <Li>Transform macro calls into internal runtime functions</Li>
        <Li>Rewrite all variable reads/writes to use <InlineCode>.value</InlineCode></Li>
        <Li>Convert JSX into direct DOM creation and fine-grained update bindings</Li>
      </Ul>

      <H3>2. Runtime (&lt;3KB)</H3>
      <Ul>
        <Li><strong>Signal</strong> — stores a value, maintains subscriber list</Li>
        <Li><strong>Derived</strong> — cached computed value with automatic dependency tracking</Li>
        <Li><strong>Effect</strong> — side effects with automatic cleanup</Li>
        <Li><strong>Pub/Sub</strong> — when a signal changes, notify all subscribers</Li>
      </Ul>

      <H2>Signal Implementation</H2>
      <CodeBlock code={`class Signal<T> {
  private _value: T
  private _subscribers: Set<Effect>

  get value(): T {
    // Track: register current effect as subscriber
    if (currentEffect) {
      this._subscribers.add(currentEffect)
      currentEffect.addDependency(this)
    }
    return this._value
  }

  set value(newValue: T) {
    if (this._value !== newValue) {
      this._value = newValue
      // Notify: trigger all subscribers
      for (const sub of this._subscribers) {
        sub.schedule()
      }
    }
  }
}`} title="Simplified signal.ts" />

      <H2>JSX Compilation</H2>
      <P>JSX is not compiled to virtual DOM. Instead, each element becomes a direct DOM creation call with fine-grained bindings.</P>
      <CodeBlock code={`// Input JSX
<div class={cls}>
  <span>{count} items</span>
</div>

// Compiled output
(() => {
  const __el1 = __createElement("div")
  __bindAttr(__el1, "class", () => cls.value)
  const __el2 = __createElement("span")
  const __t1 = __createText("")
  __bindText(__t1, () => count.value)
  __el2.appendChild(__t1)
  __el2.appendChild(__createText(" items"))
  __el1.appendChild(__el2)
  return __el1
})()`} title="JSX → DOM operations" />

      <H2>Update Flow</H2>
      <P>When a signal changes, the update path is direct and predictable:</P>
      <CodeBlock code={`count.value = 5
  → Signal.set() is called
    → Each subscriber (Effect/Derived) is notified
      → Effect runs its update function
        → DOM node is directly updated (textNode.textContent = "5")
// No diffing, no re-rendering, no reconciliation`} />

      <Note>This architecture makes Aether's behavior completely deterministic. Given the same source code, the compiler always produces the same output. This predictability is what makes it AI-friendly.</Note>
    </DocPage>
  )
}

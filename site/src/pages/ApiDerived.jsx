import { $state, $derived } from 'aether'
import { CodeBlock, InlineCode } from '../components/CodeBlock.jsx'
import { DocPage, H1, H2, P, Note } from '../components/DocPage.jsx'
import { colors } from '../styles.js'

export function ApiDerived() {
  let a = $state(3)
  let b = $state(4)
  let sum = $derived(() => a + b)

  return (
    <DocPage>
      <H1>$derived</H1>
      <P>Creates a cached computed value that automatically re-evaluates when its dependencies change.</P>

      <H2>Syntax</H2>
      <CodeBlock code={`let computedValue = $derived(() => expression)`} />

      <H2>How It Works</H2>
      <P>The compiler tracks which signals are read inside the derivation function. When any dependency changes, the derived value is recomputed. Multiple reads return the cached result.</P>

      <CodeBlock code={`let firstName = $state('John')
let lastName = $state('Doe')
let fullName = $derived(() => \`\${firstName} \${lastName}\`)

console.log(fullName) // "John Doe"
firstName = 'Jane'
console.log(fullName) // "Jane Doe" — auto-updated`} />

      <H2>Live Demo</H2>
      <div style={`margin: 1rem 0; padding: 1.5rem; border: 1px solid ${colors.border}; border-radius: 8px; background: ${colors.codeBg}; text-align: center`}>
        <div style="display: flex; gap: 2rem; justify-content: center; align-items: center; margin-bottom: 1rem">
          <div>
            <div style={`font-size: 0.75rem; color: ${colors.textDim}; margin-bottom: 0.25rem`}>a</div>
            <div style={`font-size: 1.5rem; font-weight: 700; color: ${colors.text}`}>{a}</div>
          </div>
          <div style={`font-size: 1.2rem; color: ${colors.textDim}`}>+</div>
          <div>
            <div style={`font-size: 0.75rem; color: ${colors.textDim}; margin-bottom: 0.25rem`}>b</div>
            <div style={`font-size: 1.5rem; font-weight: 700; color: ${colors.text}`}>{b}</div>
          </div>
          <div style={`font-size: 1.2rem; color: ${colors.textDim}`}>=</div>
          <div>
            <div style={`font-size: 0.75rem; color: ${colors.textDim}; margin-bottom: 0.25rem`}>sum (derived)</div>
            <div style={`font-size: 1.5rem; font-weight: 700; color: ${colors.accent}`}>{sum}</div>
          </div>
        </div>
        <div style="display: flex; gap: 0.5rem; justify-content: center">
          <button onClick={() => a++} style={`padding: 0.4rem 1rem; border-radius: 6px; border: none; background: ${colors.accent}; color: white; cursor: pointer`}>a++</button>
          <button onClick={() => b++} style={`padding: 0.4rem 1rem; border-radius: 6px; border: none; background: ${colors.accent}; color: white; cursor: pointer`}>b++</button>
        </div>
      </div>

      <H2>Compilation</H2>
      <CodeBlock code={`// Source
let sum = $derived(() => a + b)
console.log(sum)

// Compiled output
let sum = __derived(() => a.value + b.value)
console.log(sum.value)`} title="Before → After" />

      <Note>Derived values are read-only. Assigning to a derived variable is a compile-time error.</Note>
    </DocPage>
  )
}

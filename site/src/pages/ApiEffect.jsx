import { $state, $effect } from 'aether'
import { CodeBlock, InlineCode } from '../components/CodeBlock.jsx'
import { DocPage, H1, H2, P, Note } from '../components/DocPage.jsx'
import { colors, fonts } from '../styles.js'

export function ApiEffect() {
  let ticks = $state(0)

  $effect(() => {
    const timer = setInterval(() => ticks++, 1000)
    return () => clearInterval(timer)
  })

  return (
    <DocPage>
      <H1>$effect</H1>
      <P>Runs a side effect that automatically re-executes when its dependencies change. Cleanup functions are called on re-run and component unmount.</P>

      <H2>Syntax</H2>
      <CodeBlock code={`$effect(() => {
  // side effect code
  return () => {
    // optional cleanup
  }
})`} />

      <H2>Auto-tracking</H2>
      <P>Dependencies are tracked automatically — no dependency array needed.</P>
      <CodeBlock code={`let query = $state('')

$effect(() => {
  // Re-runs whenever query changes
  fetch(\`/api/search?q=\${query}\`)
    .then(r => r.json())
    .then(data => results = data)
})`} />

      <H2>Cleanup</H2>
      <P>Return a cleanup function from the effect. It will be called before the next re-run and when the component unmounts.</P>
      <CodeBlock code={`$effect(() => {
  const ws = new WebSocket(url)
  ws.onmessage = (e) => messages = [...messages, e.data]
  return () => ws.close()  // cleanup on unmount
})`} />

      <H2>Live Demo</H2>
      <div style={`margin: 1rem 0; padding: 1.5rem; border: 1px solid ${colors.border}; border-radius: 8px; background: ${colors.codeBg}; text-align: center`}>
        <div style={`font-size: 0.8rem; color: ${colors.textDim}; margin-bottom: 0.5rem`}>Timer (auto-incrementing via $effect)</div>
        <div style={`font-size: 2.5rem; font-weight: 700; color: ${colors.accent}; font-family: ${fonts.mono}`}>{ticks}</div>
        <div style={`font-size: 0.75rem; color: ${colors.textDim}; margin-top: 0.5rem`}>seconds since page load</div>
      </div>

      <H2>Compilation</H2>
      <CodeBlock code={`// Source
$effect(() => {
  document.title = \`Count: \${count}\`
})

// Compiled output
__effect(() => {
  document.title = \`Count: \${count.value}\`
})`} title="Before → After" />
    </DocPage>
  )
}

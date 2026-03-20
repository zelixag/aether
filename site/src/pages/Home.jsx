import { $state } from 'aether'
import { CodeBlock } from '../components/CodeBlock.jsx'
import { colors, fonts } from '../styles.js'

export function Home({ onNavigate }) {
  let count = $state(0)

  const heroCode = `import { $state, $derived, mount } from 'aether'

function Counter() {
  let count = $state(0)
  let double = $derived(() => count * 2)

  return (
    <div>
      <p>Count: {count} (double: {double})</p>
      <button onClick={() => count++}>+1</button>
    </div>
  )
}

mount(Counter, '#app')`

  const compileCode = `// Your code
let count = $state(0)
count++

// Compiled output
let count = __signal(0)
count.value++`

  const features = [
    { icon: '\u26A1', title: 'Compile-time Transforms', desc: 'Macros like $state are transformed at build time. Zero runtime overhead for the reactive system.' },
    { icon: '\uD83C\uDFAF', title: 'Fine-grained Updates', desc: 'No virtual DOM diffing. Each signal update directly modifies the exact DOM node that changed.' },
    { icon: '\uD83D\uDCE6', title: 'Runtime < 3KB', desc: 'The entire runtime is a minimal pub/sub system. Everything else is handled at compile time.' },
    { icon: '\uD83D\uDD27', title: 'Built-in Everything', desc: 'Router, state management, scoped styles \u2014 all built-in with the same macro syntax.' },
    { icon: '\uD83E\uDD16', title: 'AI-Friendly', desc: 'Deterministic compilation makes it easy for AI to predict the output. Fewer bugs, faster iteration.' },
    { icon: '\uD83D\uDCDD', title: 'TypeScript Native', desc: '100% TypeScript throughout. Full type inference for all macros without extra generics.' },
  ]

  return (
    <div>
      <section style={`
        padding: 5rem 2rem 3.5rem;
        text-align: center;
        max-width: 720px; margin: 0 auto;
      `}>
        <div style={`
          display: inline-flex; align-items: center; gap: 0.4rem;
          padding: 0.3rem 0.7rem; border-radius: 20px;
          background: ${colors.accentDim}; color: ${colors.accent};
          font-size: 0.75rem; font-weight: 500;
          margin-bottom: 2rem;
        `}>
          <span>This site is built with Aether</span>
        </div>

        <h1 style={`
          font-size: 3.75rem; font-weight: 800; line-height: 1.05;
          letter-spacing: -0.035em; margin-bottom: 1.25rem;
          color: ${colors.text};
        `}>
          The framework<br />that compiles away
        </h1>

        <p style={`
          font-size: 1.125rem; color: ${colors.textMuted};
          line-height: 1.65; margin-bottom: 2.5rem;
          max-width: 520px; margin-left: auto; margin-right: auto;
        `}>
          Write reactive code with simple variables. The compiler transforms
          it into optimized DOM operations. No virtual DOM. No hooks. No .value.
        </p>

        <div style="display: flex; gap: 0.625rem; justify-content: center">
          <button onClick={() => onNavigate('/guide/getting-started')}
                  style={`
                    padding: 0.625rem 1.375rem; border-radius: 8px; border: none;
                    background: ${colors.accent}; color: white;
                    font-size: 0.875rem; font-weight: 600; cursor: pointer;
                  `}>
            Get Started
          </button>
          <a href="https://github.com/zelixag/aether" target="_blank"
             style={`
               padding: 0.625rem 1.375rem; border-radius: 8px;
               border: 1px solid ${colors.borderLight}; background: transparent;
               color: ${colors.text}; font-size: 0.875rem; font-weight: 500;
               cursor: pointer; text-decoration: none;
             `}>
            View on GitHub
          </a>
        </div>
      </section>

      <section style="max-width: 600px; margin: 0 auto 3rem; padding: 0 2rem">
        <CodeBlock code={heroCode} title="Counter.jsx" />
      </section>

      <section style={`
        max-width: 600px; margin: 0 auto 4rem; padding: 0 2rem;
        display: flex; gap: 1rem; align-items: stretch;
      `}>
        <div style={`
          padding: 1.25rem 1.5rem; border-radius: 10px;
          border: 1px solid ${colors.border}; background: ${colors.codeBg};
          text-align: center; flex: 1;
        `}>
          <div style={`font-size: 2.5rem; font-weight: 700; color: ${colors.accent}; margin-bottom: 0.25rem; font-family: ${fonts.mono}`}>
            {count}
          </div>
          <div style={`font-size: 0.8rem; color: ${colors.textDim}; margin-bottom: 0.75rem`}>
            Live counter
          </div>
          <div style="display: flex; gap: 0.375rem; justify-content: center">
            <button onClick={() => count--}
                    style={`
                      width: 32px; height: 32px; border-radius: 6px; border: 1px solid ${colors.border};
                      background: transparent; color: ${colors.text};
                      font-size: 1rem; cursor: pointer; line-height: 1;
                    `}>-</button>
            <button onClick={() => count++}
                    style={`
                      width: 32px; height: 32px; border-radius: 6px; border: none;
                      background: ${colors.accent}; color: white;
                      font-size: 1rem; cursor: pointer; line-height: 1;
                    `}>+</button>
          </div>
        </div>
        <div style="flex: 1.4; min-width: 0">
          <CodeBlock code={compileCode} title="What the compiler does" />
        </div>
      </section>

      <section style={`
        padding: 3rem 2rem 4rem;
        max-width: 960px; margin: 0 auto;
        border-top: 1px solid ${colors.border};
      `}>
        <h2 style={`
          text-align: center; font-size: 1.5rem; font-weight: 700;
          margin-bottom: 0.5rem; color: ${colors.text};
          letter-spacing: -0.02em;
        `}>Why Aether?</h2>
        <p style={`
          text-align: center; color: ${colors.textDim};
          margin-bottom: 2.5rem; font-size: 0.9rem;
        `}>
          Designed for humans, browsers, and AI.
        </p>

        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem">
          {features.map(f => (
            <div style={`
              padding: 1.25rem; border-radius: 8px;
              border: 1px solid ${colors.border};
              background: ${colors.codeBg};
            `}>
              <div style="font-size: 1.25rem; margin-bottom: 0.5rem">{f.icon}</div>
              <h3 style={`font-size: 0.875rem; font-weight: 600; margin-bottom: 0.375rem; color: ${colors.text}`}>
                {f.title}
              </h3>
              <p style={`font-size: 0.8rem; color: ${colors.textDim}; line-height: 1.5; margin: 0`}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer style={`
        border-top: 1px solid ${colors.border};
        padding: 1.5rem 2rem; text-align: center;
        color: ${colors.textDim}; font-size: 0.75rem;
      `}>
        MIT License | Built with Aether
      </footer>
    </div>
  )
}

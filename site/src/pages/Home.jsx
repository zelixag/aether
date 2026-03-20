import { $state } from 'aether'
import { CodeBlock } from '../components/CodeBlock.jsx'
import { colors, fonts } from '../styles.js'

export function Home({ onNavigate }) {
  // Live counter demo
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

  const compileCode = `// Your code (human-friendly)
let count = $state(0)
count++

// Compiled output (browser-friendly)
let count = __signal(0)
count.value++`

  const features = [
    {
      icon: '⚡',
      title: 'Compile-time Transforms',
      desc: 'Macros like $state are transformed at build time. Zero runtime overhead for the reactive system itself.',
    },
    {
      icon: '🎯',
      title: 'Fine-grained Updates',
      desc: 'No virtual DOM diffing. Each signal update directly modifies the exact DOM node that changed.',
    },
    {
      icon: '📦',
      title: 'Runtime < 3KB',
      desc: 'The entire runtime is a minimal pub/sub system. Everything else is handled at compile time.',
    },
    {
      icon: '🔧',
      title: 'Built-in Everything',
      desc: 'Router, state management, scoped styles — all built-in with the same macro syntax.',
    },
    {
      icon: '🤖',
      title: 'AI-Friendly',
      desc: 'Deterministic compilation makes it easy for AI to predict the output. Fewer bugs, faster iteration.',
    },
    {
      icon: '📝',
      title: 'TypeScript Native',
      desc: '100% TypeScript throughout. Full type inference for all macros without extra generics.',
    },
  ]

  return (
    <div>
      <section style={`
        padding: 6rem 2rem 4rem;
        text-align: center;
        max-width: 800px; margin: 0 auto;
      `}>
        <div style={`
          display: inline-flex; align-items: center; gap: 0.5rem;
          padding: 0.35rem 0.75rem; border-radius: 20px;
          background: ${colors.accentDim}; color: ${colors.accent};
          font-size: 0.8rem; font-weight: 500;
          margin-bottom: 1.5rem;
        `}>
          <span>Built with Aether</span>
          <span style="opacity: 0.5">|</span>
          <span>This site is powered by Aether itself</span>
        </div>

        <h1 style={`
          font-size: 3.5rem; font-weight: 800; line-height: 1.1;
          letter-spacing: -0.03em; margin-bottom: 1.5rem;
          background: linear-gradient(135deg, ${colors.text} 0%, ${colors.textMuted} 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        `}>
          The framework that<br />compiles away
        </h1>

        <p style={`
          font-size: 1.2rem; color: ${colors.textMuted};
          line-height: 1.6; margin-bottom: 2.5rem; max-width: 600px; margin-left: auto; margin-right: auto;
        `}>
          Write reactive code with simple variables. The compiler transforms it into
          optimized DOM operations. No virtual DOM. No hooks rules. No .value.
        </p>

        <div style="display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap">
          <button onClick={() => onNavigate('/guide/getting-started')}
                  style={`
                    padding: 0.7rem 1.5rem; border-radius: 8px; border: none;
                    background: ${colors.accent}; color: white;
                    font-size: 0.95rem; font-weight: 600; cursor: pointer;
                    transition: background 0.15s;
                  `}>
            Get Started
          </button>
          <a href="https://github.com/zelixag/aether" target="_blank"
             style={`
               padding: 0.7rem 1.5rem; border-radius: 8px;
               border: 1px solid ${colors.border}; background: transparent;
               color: ${colors.text}; font-size: 0.95rem; font-weight: 500;
               cursor: pointer; text-decoration: none;
               display: inline-flex; align-items: center; gap: 0.5rem;
             `}>
            GitHub
          </a>
        </div>
      </section>

      <section style={`
        max-width: 680px; margin: 0 auto 4rem; padding: 0 2rem;
      `}>
        <CodeBlock code={heroCode} title="Counter.jsx" />
      </section>

      <section style={`
        padding: 0 2rem 4rem;
        display: flex; align-items: center; justify-content: center; gap: 1.5rem;
        flex-wrap: wrap; max-width: 680px; margin: 0 auto;
      `}>
        <div style={`
          padding: 1.5rem 2rem; border-radius: 12px;
          border: 1px solid ${colors.border};
          background: ${colors.bgSurface};
          text-align: center; flex: 1; min-width: 180px;
        `}>
          <div style={`font-size: 2rem; font-weight: 700; color: ${colors.accent}; margin-bottom: 0.25rem`}>
            {count}
          </div>
          <div style={`font-size: 0.85rem; color: ${colors.textMuted}; margin-bottom: 1rem`}>
            Live counter — try it
          </div>
          <div style="display: flex; gap: 0.5rem; justify-content: center">
            <button onClick={() => count--}
                    style={`
                      width: 36px; height: 36px; border-radius: 8px; border: 1px solid ${colors.border};
                      background: ${colors.bgCard}; color: ${colors.text};
                      font-size: 1.1rem; cursor: pointer;
                    `}>-</button>
            <button onClick={() => count++}
                    style={`
                      width: 36px; height: 36px; border-radius: 8px; border: none;
                      background: ${colors.accent}; color: white;
                      font-size: 1.1rem; cursor: pointer;
                    `}>+</button>
          </div>
        </div>
        <div style={`
          padding: 1.5rem 2rem; border-radius: 12px;
          border: 1px solid ${colors.border};
          background: ${colors.bgSurface};
          text-align: center; flex: 1; min-width: 180px;
        `}>
          <div style={`font-size: 0.8rem; color: ${colors.textDim}; margin-bottom: 0.5rem`}>What the compiler does</div>
          <CodeBlock code={compileCode} />
        </div>
      </section>

      <section style={`
        padding: 3rem 2rem 5rem;
        max-width: 1000px; margin: 0 auto;
      `}>
        <h2 style={`
          text-align: center; font-size: 1.8rem; font-weight: 700;
          margin-bottom: 0.75rem; color: ${colors.text};
        `}>Why Aether?</h2>
        <p style={`
          text-align: center; color: ${colors.textMuted};
          margin-bottom: 3rem; font-size: 1rem;
        `}>
          A framework designed for humans, browsers, and AI — all three.
        </p>

        <div style={`
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1rem;
        `}>
          {features.map(f => (
            <div style={`
              padding: 1.5rem; border-radius: 10px;
              border: 1px solid ${colors.border};
              background: ${colors.bgSurface};
              transition: border-color 0.15s;
            `}>
              <div style="font-size: 1.5rem; margin-bottom: 0.75rem">{f.icon}</div>
              <h3 style={`font-size: 1rem; font-weight: 600; margin-bottom: 0.5rem; color: ${colors.text}`}>
                {f.title}
              </h3>
              <p style={`font-size: 0.85rem; color: ${colors.textMuted}; line-height: 1.5`}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer style={`
        border-top: 1px solid ${colors.border};
        padding: 2rem; text-align: center;
        color: ${colors.textDim}; font-size: 0.8rem;
      `}>
        <p>MIT License | Built with Aether by zelixag</p>
      </footer>
    </div>
  )
}

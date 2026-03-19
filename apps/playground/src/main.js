// Aether Playground - Standalone Version
// No build step required - runs directly in browser with CDN resources

const DEFAULT_CODE = `// Aether Playground - Try it!
// Use $state, $derived, $effect, JSX

import { $state, $derived, $effect, mount, Button } from 'aether'

function Counter() {
  let count = $state(0)
  let doubled = $derived(() => count * 2)

  $effect(() => {
    document.title = \`Count: \${count}\`
  })

  const s = $style\`
    .container {
      padding: 2rem;
      text-align: center;
      font-family: system-ui, sans-serif;
    }
    .count {
      font-size: 4rem;
      font-weight: 200;
      color: #667eea;
      margin: 1rem 0;
    }
    .label {
      color: #888;
      font-size: 1rem;
    }
    .buttons {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 1.5rem;
    }
  \`

  return (
    <div class="container">
      <h1>Aether Counter</h1>
      <p class="count">{count}</p>
      <p class="label">Doubled: {doubled}</p>
      <div class="buttons">
        <Button variant="secondary" size="sm" onClick={() => count--}>-</Button>
        <Button variant="ghost" onClick={() => count = 0}>Reset</Button>
        <Button variant="primary" size="sm" onClick={() => count++}>+</Button>
      </div>
    </div>
  )
}

mount(Counter, '#preview')
`

// Embedded Aether Runtime (simplified for playground)
const AETHER_RUNTIME = `
// Aether Runtime (simplified for playground)
class Signal {
  constructor(v) { this._value = v; this._subs = new Set(); }
  get value() {
    if (activeEffect) { this._subs.add(activeEffect); activeEffect._deps.add(this); }
    return this._value;
  }
  set value(v) {
    if (Object.is(this._value, v)) return;
    this._value = v;
    for (const s of this._subs) scheduleUpdate(s);
  }
}

class Effect {
  constructor(fn) {
    this._fn = fn; this._deps = new Set(); this._cleanup = null;
    this._active = true;
    this.run();
  }
  run() {
    if (!this._active) return;
    this._cleanupDeps();
    if (this._cleanup) this._cleanup();
    pushEffect(this);
    try { this._cleanup = this._fn(); } finally { popEffect(); }
  }
  _cleanupDeps() {
    for (const d of this._deps) d._subs.delete(this);
    this._deps.clear();
  }
  dispose() {
    this._active = false;
    this._cleanupDeps();
    if (this._cleanup) { this._cleanup(); this._cleanup = null; }
  }
}

class Derived {
  constructor(fn) {
    this._fn = fn; this._sig = new Signal(undefined); this._deps = new Set();
    this._dirty = true; this._compute();
  }
  _compute() {
    pushEffect(this);
    try { this._sig._value = this._fn(); this._dirty = false; } finally { popEffect(); }
  }
  run() {
    if (this._dirty) return;
    this._dirty = true;
    for (const s of this._sig._subs) scheduleUpdate(s);
  }
  get value() {
    if (this._dirty) this._compute();
    if (activeEffect) { this._sig._subs.add(activeEffect); activeEffect._deps.add(this._sig); }
    return this._sig._value;
  }
}

let activeEffect = null;
const effectStack = [];
function pushEffect(e) { effectStack.push(activeEffect); activeEffect = e; }
function popEffect() { activeEffect = effectStack.pop() || null; }

let pending = new Set();
let sched = false;
function scheduleUpdate(e) {
  pending.add(e);
  if (!sched) { sched = true; queueMicrotask(flush); }
}
function flush() {
  if (batchDepth > 0) return;
  sched = false;
  const updates = pending; pending = new Set();
  for (const e of updates) if (e._active !== false) e.run();
}
let batchDepth = 0;

function __signal(v) { return new Signal(v); }
function __derived(fn) { return new Derived(fn); }
function __effect(fn) { return new Effect(fn); }

function mount(fn, id) {
  const el = typeof id === 'string' ? document.querySelector(id) : id;
  if (el) el.innerHTML = '';
  const ctx = {};
  const nodes = fn(ctx);
  if (el) {
    const arr = Array.isArray(nodes) ? nodes : [nodes];
    arr.forEach(n => el.appendChild(n));
  }
}

// DOM helpers
function __createElement(tag) { return document.createElement(tag); }
function __createText(v) { return document.createTextNode(String(v || '')); }
function __setAttr(el, name, v) {
  if (name === 'className' || name === 'class') el.className = String(v || '');
  else if (name.startsWith('on')) {
    const evt = name.slice(2).toLowerCase();
    if (typeof v === 'function') el.addEventListener(evt, v);
  }
  else if (typeof v === 'boolean') v ? el.setAttribute(name, '') : el.removeAttribute(name);
  else el.setAttribute(name, String(v || ''));
}
function __bindText(node, getter) {
  const eff = __effect(() => { node.textContent = String(getter() || ''); });
  return eff;
}
function __bindAttr(el, name, getter) {
  const eff = __effect(() => {
    const v = getter();
    if (name === 'className' || name === 'class') el.className = String(v || '');
    else if (typeof v === 'boolean') v ? el.setAttribute(name, '') : el.removeAttribute(name);
    else el.setAttribute(name, String(v || ''));
  });
  return eff;
}

// Button component
function Button({ variant = 'primary', size = 'md', onClick, children, disabled = false }) {
  const el = __createElement('button');
  el.className = 'aether-btn aether-btn--' + variant + (size !== 'md' ? ' aether-btn--' + size : '') + (disabled ? ' aether-btn--disabled' : '');
  el.disabled = disabled;
  el.textContent = children;
  el.onclick = onClick;
  return el;
}

// Global error handler
window.onerror = function(msg, url, line, col, error) {
  console.error('Preview error:', msg);
  return false;
};
`

let editor = null
let currentCode = DEFAULT_CODE

function setStatus(status) {
  const el = document.getElementById('status')
  el.textContent = status
  el.className = 'status ' + status
}

function setOutput(code, error) {
  const output = document.getElementById('output')
  if (error) {
    output.innerHTML = '<div class="output-error">Error: ' + escapeHtml(error) + '</div>'
  } else if (!code) {
    output.innerHTML = '<div class="output-placeholder">Compiled code will appear here...</div>'
  } else {
    output.innerHTML = '<pre class="output-code">' + escapeHtml(code) + '</pre>'
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

async function initMonaco() {
  // Load Monaco from CDN
  return new Promise((resolve, reject) => {
    const loaderScript = document.createElement('script')
    loaderScript.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs/loader.js'
    loaderScript.onload = () => {
      window.require.config({
        paths: {
          'vs': 'https://cdn.jsdelivr.net/npm/monaco-editor@0.52.0/min/vs'
        }
      })
      window.require(['vs/editor/editor.main'], () => {
        resolve()
      }, reject)
    }
    loaderScript.onerror = reject
    document.head.appendChild(loaderScript)
  })
}

function createAetherPlugin() {
  // Simplified Aether transform plugin
  return function({ types: t }) {
    return {
      visitor: {
        ImportDeclaration(path) {
          if (path.node.source.value === 'aether') {
            const kept = []
            const aetherImports = []

            for (const spec of path.node.specifiers) {
              if (t.isImportSpecifier(spec)) {
                const name = spec.imported.name
                if (['$state', '$derived', '$effect', '$store', '$async'].includes(name)) {
                  aetherImports.push(name)
                } else {
                  kept.push(spec)
                }
              } else {
                kept.push(spec)
              }
            }

            const newSpecifiers = []

            if (aetherImports.includes('$state')) {
              newSpecifiers.push(t.importSpecifier(t.identifier('__signal'), t.identifier('__signal')))
            }
            if (aetherImports.includes('$derived')) {
              newSpecifiers.push(t.importSpecifier(t.identifier('__derived'), t.identifier('__derived')))
            }
            if (aetherImports.includes('$effect')) {
              newSpecifiers.push(t.importSpecifier(t.identifier('__effect'), t.identifier('__effect')))
            }

            for (const spec of kept) {
              newSpecifiers.push(spec)
            }

            if (newSpecifiers.length > 0) {
              path.node.specifiers = newSpecifiers
            } else {
              path.remove()
            }
          }
        },

        VariableDeclaration(path) {
          for (const decl of path.node.declarations) {
            if (!t.isVariableDeclarator(decl)) continue
            if (!t.isCallExpression(decl.init)) continue
            const calleeName = decl.init.callee.name
            if (calleeName === '$state') {
              decl.init.callee = t.identifier('__signal')
            } else if (calleeName === '$derived') {
              decl.init.callee = t.identifier('__derived')
            } else if (calleeName === '$effect') {
              decl.init.callee = t.identifier('__effect')
            }
          }
        },

        JSXElement(path) {
          const openingElement = path.node.openingElement
          const tagName = openingElement.name.name

          const args = [t.stringLiteral(tagName)]

          let hasAttributes = false
          const props = t.objectExpression([])

          for (const attr of openingElement.attributes) {
            if (t.isJSXAttribute(attr)) {
              hasAttributes = true
              const attrName = attr.name.name

              if (attrName === 'className') {
                props.properties.push(t.objectProperty(
                  t.identifier('className'),
                  attr.value ? attr.value.expression : t.stringLiteral('')
                ))
              } else if (attrName.startsWith('on') && attr.value && t.isJSXExpressionContainer(attr.value)) {
                props.properties.push(t.objectProperty(t.identifier(attrName), attr.value.expression))
              } else if (attr.value === null) {
                props.properties.push(t.objectProperty(t.stringLiteral(attrName), t.booleanLiteral(true)))
              } else if (t.isJSXExpressionContainer(attr.value)) {
                props.properties.push(t.objectProperty(t.stringLiteral(attrName), attr.value.expression))
              } else if (t.isStringLiteral(attr.value)) {
                props.properties.push(t.objectProperty(t.stringLiteral(attrName), attr.value))
              }
            }
          }

          if (hasAttributes) {
            args.push(props)
          }

          if (path.node.children.length > 0) {
            if (args.length === 1) args.push(t.objectExpression([]))

            const children = path.node.children
              .filter(c => !t.isJSXText(c) || c.value.trim())
              .map(c => {
                if (t.isJSXElement(c)) return c
                if (t.isJSXExpressionContainer(c)) return c.expression
                if (t.isJSXText(c)) return t.stringLiteral(c.value)
                return null
              })
              .filter(Boolean)

            if (children.length === 1) {
              args.push(children[0])
            } else if (children.length > 1) {
              args.push(t.arrayExpression(children))
            }
          }

          const createElementCall = t.callExpression(t.identifier('__createElement'), args)

          if (path.node.closingElement) {
            path.replaceWith(createElementCall)
          }
        },

        JSXFragment(path) {
          const children = path.node.children
            .filter(c => !t.isJSXText(c) || c.value.trim())
            .map(c => {
              if (t.isJSXElement(c)) return c
              if (t.isJSXExpressionContainer(c)) return c.expression
              if (t.isJSXText(c)) return t.stringLiteral(c.value)
              return null
            })
            .filter(Boolean)

          if (children.length === 1) {
            path.replaceWith(children[0])
          } else {
            path.replaceWith(t.arrayExpression(children))
          }
        }
      }
    }
  }
}

async function runCode() {
  setStatus('compiling')
  setOutput(null, null)

  try {
    // Load Babel standalone
    const babelScript = document.createElement('script')
    babelScript.src = 'https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.0/babel.min.js'

    await new Promise((resolve, reject) => {
      babelScript.onload = resolve
      babelScript.onerror = reject
      document.head.appendChild(babelScript)
    })

    const code = editor.getValue()

    const result = Babel.transform(code, {
      plugins: [createAetherPlugin()],
      sourceMaps: false,
      comments: true
    })

    if (!result || !result.code) {
      throw new Error('Compilation failed')
    }

    setOutput(result.code, null)
    setStatus('running')

    // Update preview iframe
    const previewEl = document.getElementById('preview-iframe')
    const previewDoc = previewEl.contentDocument || previewEl.contentWindow.document
    previewDoc.open()
    previewDoc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { margin: 0; font-family: system-ui, sans-serif; }
          .aether-btn {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            font-family: inherit;
          }
          .aether-btn--primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
          }
          .aether-btn--primary:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
          }
          .aether-btn--secondary {
            background: rgba(255, 255, 255, 0.1);
            color: #333;
            border: 1px solid rgba(0,0,0,0.2);
          }
          .aether-btn--secondary:hover:not(:disabled) {
            background: rgba(0,0,0,0.05);
          }
          .aether-btn--ghost {
            background: transparent;
            color: #888;
          }
          .aether-btn--ghost:hover:not(:disabled) {
            color: #333;
            background: rgba(0,0,0,0.05);
          }
          .aether-btn--sm { padding: 0.5rem 1rem; font-size: 0.875rem; }
          .aether-btn--lg { padding: 1rem 2rem; font-size: 1.125rem; }
          .aether-btn--disabled { opacity: 0.5; cursor: not-allowed; }
        </style>
      </head>
      <body>
        <div id="preview"></div>
        <script>
          try {
            ${AETHER_RUNTIME}
            ${result.code}
          } catch(e) {
            document.body.innerHTML = '<div style="color: red; padding: 1rem; font-family: monospace;">Error: ' + e.message + '<pre style="margin-top: 0.5rem; font-size: 0.75rem; color: #666;">' + e.stack + '</pre></div>';
            console.error(e);
            parent.postMessage({ type: 'error', error: e.message }, '*');
          }
        </script>
      </body>
      </html>
    `)
    previewDoc.close()
    setStatus('success')
  } catch (err) {
    console.error('Compilation error:', err)
    setOutput(null, err.message)
    setStatus('error')
  }
}

// Initialize
async function init() {
  await initMonaco()

  editor = monaco.editor.create(document.getElementById('editor'), {
    value: DEFAULT_CODE,
    language: 'javascript',
    theme: 'vs-dark',
    fontSize: 14,
    fontFamily: "'Fira Code', 'Cascadia Code', 'Consolas', monospace",
    fontLigatures: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    lineNumbers: 'on',
    renderLineHighlight: 'line',
    tabSize: 2,
    insertSpaces: true,
    wordWrap: 'on',
    automaticLayout: true,
    padding: { top: 16, bottom: 16 },
    scrollbar: {
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    }
  })

  // Run button
  document.getElementById('run-btn').addEventListener('click', runCode)

  // Auto-run on load after a short delay
  setTimeout(runCode, 500)
}

init()

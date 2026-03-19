# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Aether** is a 100% TypeScript compile-time reactive framework designed to be AI-friendly. It transforms JSX syntax and reactive macros (`$state`, `$derived`, `$effect`) into vanilla JavaScript DOM operations — no virtual DOM diffing, no hooks rules, no `.value` noise in source code.

**Tech Stack**: 100% TypeScript throughout (compiler + runtime + tooling + ecosystem)

## Architecture

### packages/compiler (TypeScript)
Babel plugin that performs compile-time transformations:
- `$state` → `__signal(initialValue)` - reactive state
- `$derived(fn)` → `__derived(fn)` - cached derived values
- `$effect(fn)` → `__effect(fn)` - automatic cleanup on unmount
- `$store({...})` → `__store({...})` - cross-component state via Proxy
- `$async(fetcher)` → `__async(fetcher)` - async data with {value, loading, error}
- `$style` → scoped CSS with hash
- JSX → `__createElement`, `__bindText`, `__bindAttr`, `__conditional`, `__list`
- Variable reads `count` → `count.value` (for state/derived vars)
- Variable writes `count++` → `count.value++`

Key files:
- `src/index.ts` - Main Babel plugin entry, visitor pattern handlers, HMR support
- `src/transform-macros.ts` - Macro transformation logic
- `src/transform-jsx.ts` - JSX to DOM transformation
- `src/transform-style.ts` - `$style` tagged template transformation
- `src/optimize.ts` - Optimization passes (dead code elimination, constant derived inlining)
- `src/transform-ssr.ts` - SSR transformation (in progress)

### packages/runtime (TypeScript)
Runtime library (<5KB core):

Key files:
- `src/signal.ts` - Signal class, Effect class, Derived class, batch scheduler, topological sort
- `src/dom.ts` - DOM helpers: `mount`, `__createElement`, `__bindText`, `__bindAttr`, `__conditional`, `__list`, ComponentContext, HMR support
- `src/router.ts` - Built-in router: `Link`, `navigate`, `__router`
- `src/style.ts` - Scoped styles via hash
- `src/internal.ts` - Re-exports all internal APIs
- `src/ssr.ts` - SSR runtime (renderToString, renderToStream, hydrate)
- `src/components/` - UI component library:
  - `Button.ts` - primary/secondary/ghost variants, sm/md/lg sizes, disabled
  - `Input.ts` - text/number/password types, placeholder, disabled, controlled value
  - `Card.ts`, `CardHeader.ts`, `CardBody.ts`, `CardFooter.ts`
  - `Form.ts` - form with field-level validation (required, email, minLength, pattern)
  - `Modal.ts` - dialog with backdrop click and ESC close
  - `Table.ts` - data table with sorting and pagination
  - `Tabs.ts` - tab panel component

### Security Design
The runtime includes prototype chain pollution protection in `dom.ts:__spreadAttrs` and `__setAttr` — a blacklist of unsafe attribute names (`__proto__`, `constructor`, `prototype`, etc.) is checked before setting attributes.

## Project Structure

```
aether/
├── packages/
│   ├── compiler/           # 100% TypeScript - Babel plugin
│   │   └── src/
│   │       ├── index.ts         # Main plugin + Vite plugin
│   │       ├── transform-*.ts   # Macro/JSX/Style/SSR transforms
│   │       └── optimize.ts      # Dead code elimination, inlining
│   ├── runtime/           # 100% TypeScript - Runtime library
│   │   └── src/
│   │       ├── signal.ts        # Signal, Effect, Derived, batch
│   │       ├── dom.ts           # DOM operations, mount, HMR
│   │       ├── router.ts        # Built-in router
│   │       ├── style.ts         # Scoped styles
│   │       ├── components/      # UI components (Button, Input, Form, Modal, Table, Tabs)
│   │       └── ssr.ts           # SSR runtime
│   ├── create-aether-app/ # 100% TypeScript - CLI scaffolding tool
│   │   ├── bin.ts              # CLI entry point
│   │   ├── index.ts            # Main logic
│   │   ├── tsconfig.json       # TypeScript config
│   │   └── src/*.ts           # All source files TypeScript
│   └── adapter-react/     # 100% TypeScript - React adapter layer
├── apps/
│   └── playground/        # Interactive playground (in progress)
├── examples/
│   └── counter/           # Counter example with HMR
├── docs/
│   ├── api/               # API documentation
│   ├── guide/             # Getting started, concepts
│   ├── rfc/               # RFC documents
│   └── architecture.md    # Architecture design doc
└── tsconfig.json          # Root TypeScript config
```

## Commands

```bash
# Build all packages (TypeScript → JS via esbuild)
npm run build

# Type check all packages
npm run typecheck

# Run all tests
npm run test:all

# Run specific test suites
npm run test:runtime           # Basic runtime tests
npm run test:runtime:advanced  # Signal edge cases
npm run test:runtime:security  # Prototype chain protection
npm run test:runtime:performance # Benchmarks
npm run test:compiler          # Basic compiler tests
npm run test:compiler:advanced  # Macro/JSX advanced tests

# Run counter example
npm run example:counter

# Create new project
cd packages/create-aether-app && npm install && npm run build
npm create aether-app my-app
```

## Development Notes

- **100% TypeScript**: All packages (compiler, runtime, tooling, ecosystem) use TypeScript
- ES modules (`"type": "module"`) throughout
- Build uses esbuild for fast TypeScript compilation
- Compiler requires `@babel/core` and `@babel/plugin-syntax-jsx` as peer dependencies
- Vite plugin at `packages/compiler/src/index.ts:aetherVitePlugin()`
- Type definitions provide IDE support since macros are compile-time only

## v0.2 Roadmap (Completed)

| Feature | Status |
|---------|--------|
| TypeScript migration (compiler) | ✅ |
| TypeScript migration (runtime) | ✅ |
| UI component library | ✅ (Button, Input, Card, Form, Modal, Table, Tabs) |
| Compiler optimization passes | ✅ |
| Effect cleanup & lifecycle | ✅ |
| HMR support | ✅ |
| SSR compiler transformation | ✅ |
| SSR runtime | ✅ |
| CLI scaffolding tool | ✅ (100% TypeScript) |
| Interactive playground | ✅ |
| React/Vue adapter | ✅ |

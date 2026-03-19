import * as esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

async function buildAll() {
  // Build main runtime with esbuild
  const ctx1 = await esbuild.context({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outfile: 'dist/aether.js',
    format: 'esm',
    platform: 'browser',
    target: 'ES2020',
    sourcemap: true,
    sourcesContent: true,
    banner: {
      js: '// Aether Runtime v0.1.0',
    },
  });
  await ctx1.rebuild();
  await ctx1.dispose();

  // Build SSR runtime with esbuild
  const ctx2 = await esbuild.context({
    entryPoints: ['src/ssr.ts'],
    bundle: true,
    outfile: 'dist/ssr.js',
    format: 'esm',
    platform: 'browser',
    target: 'ES2020',
    sourcemap: true,
    sourcesContent: true,
    banner: {
      js: '// Aether SSR Runtime v0.1.0',
    },
  });
  await ctx2.rebuild();
  await ctx2.dispose();

  console.log('Runtime built successfully!');
}

async function watchAll() {
  // Watch main runtime
  const ctx1 = await esbuild.context({
    entryPoints: ['src/index.ts'],
    bundle: true,
    outfile: 'dist/aether.js',
    format: 'esm',
    platform: 'browser',
    target: 'ES2020',
    sourcemap: true,
    sourcesContent: true,
    banner: {
      js: '// Aether Runtime v0.1.0',
    },
  });
  await ctx1.watch();

  // Watch SSR runtime
  const ctx2 = await esbuild.context({
    entryPoints: ['src/ssr.ts'],
    bundle: true,
    outfile: 'dist/ssr.js',
    format: 'esm',
    platform: 'browser',
    target: 'ES2020',
    sourcemap: true,
    sourcesContent: true,
    banner: {
      js: '// Aether SSR Runtime v0.1.0',
    },
  });
  await ctx2.watch();

  console.log('Runtime watching for changes...');
}

if (isWatch) {
  await watchAll();
} else {
  await buildAll();
}

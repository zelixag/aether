import * as esbuild from 'esbuild';

const isWatch = process.argv.includes('--watch');

const buildOptions = {
  entryPoints: ['src/index.ts'],
  bundle: true,
  outfile: 'dist/index.js',
  format: 'esm',
  platform: 'node',
  target: 'ES2020',
  sourcemap: true,
  sourcesContent: true,
};

async function buildAll() {
  const ctx = await esbuild.context(buildOptions);
  await ctx.rebuild();
  await ctx.dispose();
  console.log('Compiler built successfully!');
}

async function watchAll() {
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  console.log('Compiler watching for changes...');
}

if (isWatch) {
  await watchAll();
} else {
  await buildAll();
}

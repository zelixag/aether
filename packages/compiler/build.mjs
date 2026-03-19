import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function buildAll() {
  const result = await esbuild.build({
    entryPoints: [join(__dirname, 'src/index.ts')],
    bundle: true,
    outfile: join(__dirname, 'dist/index.cjs'),
    format: 'cjs',
    platform: 'node',
    target: 'ES2020',
    sourcemap: true,
    sourcesContent: true,
    // Externalize everything - let Node.js resolve @babel packages
    external: ['@babel/core', '@babel/types', '@babel/traverse', '@babel/plugin-syntax-jsx', 'esbuild'],
  });

  if (result.errors.length > 0) {
    console.error('Build failed:', result.errors);
    process.exit(1);
  }

  console.log('Compiler built successfully!');
}

buildAll().catch(err => {
  console.error(err);
  process.exit(1);
});

import * as esbuild from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

async function buildAll() {
  const result = await esbuild.build({
    entryPoints: [join(__dirname, 'src/index.ts')],
    bundle: true,
    outfile: join(__dirname, 'dist/index.js'),
    format: 'esm',
    platform: 'node',
    target: 'ES2020',
    sourcemap: true,
    sourcesContent: true,
    // Externalize @babel packages and Node builtins
    // Prevents bundling CJS modules that use require('fs')
    packages: 'external',
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

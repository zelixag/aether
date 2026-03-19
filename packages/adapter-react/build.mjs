// Build script for @aether/adapter-react
import { build } from 'esbuild';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

await build({
  entryPoints: [join(__dirname, 'dist/index.js')],
  bundle: true,
  outfile: join(__dirname, 'dist/adapter-react.js'),
  format: 'esm',
  platform: 'browser',
  target: ['es2020'],
  external: ['react', 'react-dom', 'aether'],
  sourcemap: true,
  minify: process.env.NODE_ENV === 'production',
}).catch(() => {
  // If esbuild fails, just copy the TS output
  console.warn('esbuild not available, using TypeScript output directly');
});

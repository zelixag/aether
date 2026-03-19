import * as esbuild from 'esbuild';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, unlinkSync, rmdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const isWatch = process.argv.includes('--watch');
const isClean = process.argv.includes('--clean');

// Clean dist directory
function cleanDist() {
  const distDir = join(__dirname, 'dist');
  if (existsSync(distDir)) {
    for (const file of readdirSync(distDir)) {
      unlinkSync(join(distDir, file));
    }
    rmdirSync(distDir);
  }
  mkdirSync(distDir, { recursive: true });
}

// Simple build using esbuild with bundle:true but externalizing node modules
async function buildAll() {
  if (isClean) {
    cleanDist();
  }

  const result = await esbuild.build({
    entryPoints: [join(__dirname, 'src/index.ts')],
    bundle: true,
    outfile: join(__dirname, 'dist/index.js'),
    format: 'esm',
    platform: 'node',
    target: 'ES2020',
    sourcemap: true,
    sourcesContent: true,
    // Externalize node builtins and existing packages
    external: ['fs', 'path', 'module', 'url', '@babel/core', '@babel/types', '@babel/traverse'],
    // Don't bundle these - let Node.js resolve them from node_modules
    conditions: ['node'],
    banner: {
      js: `import { createRequire } from 'module';const require = createRequire(import.meta.url);`
    }
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

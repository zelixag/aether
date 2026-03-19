import { defineConfig } from 'vite';
import aether from '@aether/vite-plugin';

export default defineConfig({
  plugins: [aether()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    target: 'esnext',
    minify: 'esbuild'
  },
  ssr: {
    noExternal: ['aether']
  }
});

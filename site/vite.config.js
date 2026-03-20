import { aetherVitePlugin } from 'aether-compiler'

export default {
  plugins: [aetherVitePlugin()],
  base: '/aether/',
  build: {
    outDir: 'dist',
    minify: true,
    target: 'esnext'
  },
  server: {
    port: 3000,
    open: true
  }
}

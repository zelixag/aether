import { aetherVitePlugin } from 'aether-compiler'

export default {
  plugins: [aetherVitePlugin()],
  base: '/aether/',
  esbuild: {
    jsx: 'preserve',  // 让 Aether 编译器处理 JSX，不走 esbuild
  },
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

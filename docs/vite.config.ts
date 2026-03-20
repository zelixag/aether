import { defineConfig } from 'vite'
import { aetherVitePlugin } from 'aether-compiler'

export default defineConfig({
  plugins: [
    aetherVitePlugin()
  ],
  build: {
    minify: false,
    target: 'esnext',
    // 禁用代码分割，把所有东西打包成一个文件
    rollupOptions: {
      input: './index.html',
      output: {
        inlineDynamicImports: true
      }
    }
  },
  base: '/aether/',
  resolve: {
    alias: {
      '@': '/src'
    }
  },
  server: {
    port: 3000,
    open: true
  }
})

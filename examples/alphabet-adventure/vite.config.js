import { defineConfig } from 'vite'
import { aetherVitePlugin } from 'aether-compiler'

// 生产部署到 https://zelixag.github.io/aether/alphabet-adventure/
// 本地 dev 仍然用根路径
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/aether/alphabet-adventure/' : '/',
  plugins: [aetherVitePlugin()],
  server: {
    port: 5174,
  },
}))

import { defineConfig } from 'vite'
import { aetherVitePlugin } from 'aether-compiler'

export default defineConfig({
  plugins: [aetherVitePlugin()],
})

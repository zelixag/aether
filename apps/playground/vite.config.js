import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: '.',
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist'
  }
})

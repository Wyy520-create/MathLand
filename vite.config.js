import { defineConfig } from 'vite'

export default defineConfig({
  // GitHub Pages 项目页使用相对路径，任何子目录都能跑
  base: './',
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1500,
  },
})

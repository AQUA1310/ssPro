import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  publicDir: 'public', // 🌟 CRITICAL: Explicitly forces Vite to copy your public pantry folder
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Cleans the old broken dist folder before rebuilding
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
})
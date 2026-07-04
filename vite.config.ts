import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: [
      '@heroui/theme',
      '@heroui/system',
      '@heroui/system-rsc',
      'react',
      'react-dom',
    ],
    alias: {
      '@heroui/theme': path.resolve('./node_modules/@heroui/theme'),
      '@heroui/system-rsc': path.resolve('./node_modules/@heroui/system-rsc'),
    },
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'UNRESOLVED_IMPORT' && warning.message?.includes('@heroui/theme')) return;
        warn(warning);
      },
    },
  }
})

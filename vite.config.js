import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  const manualChunks = (id) => {
    if (!id.includes('node_modules')) {
      return undefined
    }
    if (id.includes('react-router-dom')) {
      return 'vendor-router'
    }
    if (id.includes('react') || id.includes('scheduler')) {
      return 'vendor-react'
    }
    if (id.includes('ethers')) {
      return 'vendor-ethers'
    }
    if (id.includes('@heroui') || id.includes('framer-motion')) {
      return 'vendor-ui'
    }
    if (id.includes('crypto-js') || id.includes('date-fns') || id.includes('axios')) {
      return 'vendor-utils'
    }
    return 'vendor-misc'
  }
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
      host: true
    },
    define: {
      'process.env': env
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks
        }
      },
      chunkSizeWarningLimit: 900
    }
  }
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@noble/secp256k1': '@noble/secp256k1',
    },
  },
  optimizeDeps: {
    include: ['@noble/secp256k1'],
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})

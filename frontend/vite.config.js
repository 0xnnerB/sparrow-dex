import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// rainbowkit 2.2.x references `gemini` from wagmi/connectors which isn't
// present in wagmi 3.6.x — stub it so the build resolves and tree-shaking
// removes the unused geminiWallet connector.
const wagmiGeminiStub = {
  name: 'wagmi-gemini-stub',
  transform(code, id) {
    if (id.includes('wagmi') && id.endsWith('connectors.js') && code.includes('export') && !code.includes('gemini')) {
      return { code: code + '\nexport const gemini = () => null', map: null }
    }
    return null
  },
}

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      protocolImports: true,
    }),
    wagmiGeminiStub,
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})

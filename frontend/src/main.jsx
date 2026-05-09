// Disable SES lockdown before AppKit loads
if (typeof window !== 'undefined') {
  window.__LOCKDOWN_SKIP__ = true
}

import './fetchProxy.js'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

import '@rainbow-me/rainbowkit/styles.css'
import {
  RainbowKitProvider,
  darkTheme,
} from '@rainbow-me/rainbowkit'
import { createConfig, http, WagmiProvider } from 'wagmi'
import { injected, metaMask } from 'wagmi/connectors'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import { defineChain } from 'viem'
import { sepolia, baseSepolia, arbitrumSepolia, optimismSepolia } from 'wagmi/chains'

const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'Arc Testnet', symbol: 'ARC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
})

const config = createConfig({
  chains: [arcTestnet, sepolia, baseSepolia, arbitrumSepolia, optimismSepolia],
  connectors: [metaMask(), injected()],
  transports: {
    [arcTestnet.id]:      http('https://rpc.testnet.arc.network'),
    [sepolia.id]:         http(),
    [baseSepolia.id]:     http(),
    [arbitrumSepolia.id]: http(),
    [optimismSepolia.id]: http(),
  },
})

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#e91e8c',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
          locale="en-US"
        >
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
)

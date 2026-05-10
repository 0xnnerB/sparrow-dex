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
  connectorsForWallets,
} from '@rainbow-me/rainbowkit'
import {
  injectedWallet,
  coinbaseWallet,
  rabbyWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { createConfig, http, WagmiProvider } from 'wagmi'
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

const connectors = connectorsForWallets(
  [
    {
      groupName: 'Available Wallets',
      wallets: [injectedWallet, coinbaseWallet, rabbyWallet],
    },
  ],
  {
    appName: 'Sparrow DEX',
    projectId: 'sparrowdex2024testnet',
  }
)

const config = createConfig({
  chains: [arcTestnet, sepolia, baseSepolia, arbitrumSepolia, optimismSepolia],
  connectors,
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

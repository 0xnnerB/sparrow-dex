import { useState, useEffect } from 'react'

const SECTIONS = [
  { id: 'what-is-sparrow', label: 'What is Sparrow' },
  { id: 'swap',            label: 'Swap' },
  { id: 'bridge',          label: 'Bridge' },
  { id: 'faq',             label: 'FAQ' },
  { id: 'team',            label: 'Team' },
]

export default function DocsPage({ setPage }) {
  const [activeSection, setActiveSection] = useState('what-is-sparrow')

  useEffect(() => { window.scrollTo(0, 0) }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveSection(entry.target.id)
        })
      },
      { rootMargin: '-10% 0px -80% 0px', threshold: 0 }
    )
    SECTIONS.forEach(s => {
      const el = document.getElementById(s.id)
      if (el) observer.observe(el)
    })
    return () => observer.disconnect()
  }, [])

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  return (
    <div className="docs-page">
      {/* ── SIDEBAR ── */}
      <aside className="docs-sidebar">
        <div className="docs-sidebar-brand">
          <span className="nav-brand">SPARROW</span>
          <span className="docs-sidebar-badge">DOCS</span>
        </div>

        <button className="docs-back-btn" onClick={() => setPage('home')}>
          ← Back to App
        </button>

        <nav className="docs-nav">
          {SECTIONS.map(s => (
            <button
              key={s.id}
              className={`docs-nav-link ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => scrollTo(s.id)}
            >
              {s.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── CONTENT ── */}
      <main className="docs-content">

        {/* ── WHAT IS SPARROW ── */}
        <section id="what-is-sparrow" className="docs-section">
          <h1 className="docs-h1">What is Sparrow</h1>
          <p className="docs-p">
            Sparrow is a decentralized exchange (DEX) built on <strong>Arc Network</strong>, currently
            operating on testnet. It provides a clean, accessible interface for performing token swaps
            and cross-chain USDC transfers without the complexity typically associated with DeFi infrastructure.
          </p>

          <h2 className="docs-h2">Core Features</h2>
          <ul className="docs-ul">
            <li>
              <strong>Token Swaps</strong> — Swap between USDC and EURC on Arc Testnet using
              LI.FI-powered aggregation routed through Circle's App Kit SDK.
            </li>
            <li>
              <strong>Cross-Chain Bridging</strong> — Transfer USDC natively across supported
              testnets via Circle's Cross-Chain Transfer Protocol (CCTP v2). No wrapped tokens,
              no liquidity pools.
            </li>
            <li>
              <strong>Wallet Connectivity</strong> — Seamless wallet connection via RainbowKit,
              supporting MetaMask, Rabby, and any WalletConnect-compatible wallet.
            </li>
          </ul>

          <h2 className="docs-h2">Technology Stack</h2>
          <ul className="docs-ul">
            <li><strong>Circle App Kit SDK</strong> — Core execution layer for swaps and bridges</li>
            <li><strong>LI.FI Protocol</strong> — Swap aggregation and liquidity routing</li>
            <li><strong>RainbowKit + Wagmi</strong> — Wallet connection and chain management</li>
            <li><strong>Arc Network</strong> — Primary settlement chain</li>
            <li><strong>CCTP v2</strong> — Cross-chain USDC transfers</li>
          </ul>

          <h2 className="docs-h2">The AI Agent Layer</h2>
          <p className="docs-p">
            Sparrow's long-term vision extends beyond a traditional DEX interface. The roadmap
            includes an <strong>AI-powered agent layer</strong> — a chatbot interface that allows
            users to execute DeFi operations through natural language directly connected to their wallet.
          </p>
          <p className="docs-p">
            This agent layer will support swaps, cross-chain bridges, programmable payments, and
            other agentic DeFi operations — all initiated conversationally and executed onchain
            without manual transaction flow navigation. This feature is currently in early testing
            and will be progressively integrated into the Sparrow interface.
          </p>

          <h2 className="docs-h2">Philosophy</h2>
          <p className="docs-p">
            Sparrow is built around three principles: <strong>accessibility</strong> — removing
            friction from DeFi for newcomers and builders alike; <strong>transparency</strong> —
            open-source infrastructure with no hidden routing or fees; and{' '}
            <strong>composability</strong> — designed to integrate cleanly with USDC-first networks
            and Circle's growing ecosystem of developer tools.
          </p>
        </section>

        {/* ── SWAP ── */}
        <section id="swap" className="docs-section">
          <h1 className="docs-h1">Swap</h1>
          <p className="docs-p">
            Sparrow's swap feature allows users to exchange between supported stablecoin pairs on
            Arc Testnet. The current infrastructure is powered by <strong>LI.FI Protocol</strong> as
            the aggregation layer, with execution handled by Circle's App Kit Swap Kit.
          </p>

          <h2 className="docs-h2">Swap Infrastructure</h2>
          <p className="docs-p">
            The swap flow uses <strong>LI.FI</strong> as the underlying aggregator, which routes
            trades through available liquidity sources on Arc Testnet. LI.FI is a cross-chain
            liquidity aggregation protocol that finds optimal routes and quotes across multiple DEXs
            and bridges.
          </p>
          <ul className="docs-ul">
            <li>
              <a className="docs-link" href="https://docs.li.fi" target="_blank" rel="noopener noreferrer">
                LI.FI Documentation ↗
              </a>
            </li>
            <li>
              <a className="docs-link" href="https://github.com/lifinance" target="_blank" rel="noopener noreferrer">
                LI.FI GitHub ↗
              </a>
            </li>
            <li>
              <a className="docs-link" href="https://docs.arc.network/app-kit/swap" target="_blank" rel="noopener noreferrer">
                Circle App Kit Swap Kit Docs ↗
              </a>
            </li>
          </ul>

          <h2 className="docs-h2">Supported Pairs</h2>
          <div className="docs-pair-grid">
            <div className="docs-pair-card">
              <span className="docs-pair-token">USDC</span>
              <span className="docs-pair-arrow">↔</span>
              <span className="docs-pair-token">EURC</span>
              <span className="docs-pair-network">Arc Testnet</span>
            </div>
          </div>

          <h2 className="docs-h2">How a Swap Works</h2>
          <ol className="docs-ol">
            <li>Connect your wallet via RainbowKit</li>
            <li>Select the input token (USDC or EURC) and enter the amount</li>
            <li>The App Kit fetches a quote via LI.FI aggregator and displays the estimated output</li>
            <li>Confirm the transaction — your wallet switches to Arc Testnet automatically if needed</li>
            <li>The transaction is executed onchain on Arc Testnet</li>
            <li>Output tokens are delivered to your wallet address</li>
          </ol>

          <h2 className="docs-h2">Roadmap</h2>
          <p className="docs-p">
            The current swap infrastructure relies on LI.FI aggregation as a functional foundation.
            On the roadmap, Sparrow plans to deploy its own <strong>onchain liquidity pool
            contracts</strong>, creating a native AMM (Automated Market Maker) that will replace
            the current aggregator dependency.
          </p>
          <p className="docs-p">
            This native AMM will give Sparrow full control over liquidity routing, fee structure,
            and LP incentive design — enabling a truly self-sovereign DEX layer on Arc Network.
          </p>
        </section>

        {/* ── BRIDGE ── */}
        <section id="bridge" className="docs-section">
          <h1 className="docs-h1">Bridge</h1>
          <p className="docs-p">
            Sparrow's bridge feature enables USDC transfers between supported test networks using
            Circle's <strong>Cross-Chain Transfer Protocol (CCTP) v2</strong>. CCTP is a native
            burn-and-mint mechanism — no wrapped tokens, no liquidity pools required.
          </p>

          <h2 className="docs-h2">How CCTP Works</h2>
          <p className="docs-p">CCTP operates through a four-step process:</p>
          <ol className="docs-ol">
            <li>
              <strong>Approve</strong> — User approves the USDC spend on the source chain
            </li>
            <li>
              <strong>Burn</strong> — USDC is burned on the source chain via Circle's
              TokenMessenger contract
            </li>
            <li>
              <strong>Attest</strong> — Circle's attestation service observes the burn event and
              issues a cryptographic signature
            </li>
            <li>
              <strong>Mint</strong> — The signed attestation is submitted on the destination chain,
              where native USDC is minted to the recipient address
            </li>
          </ol>
          <p className="docs-p">
            This mechanism guarantees that the total USDC supply remains constant across all chains.
            There is no liquidity fragmentation and no slippage from pool depth.
          </p>
          <ul className="docs-ul">
            <li>
              <a className="docs-link" href="https://developers.circle.com/stablecoins/cctp-getting-started" target="_blank" rel="noopener noreferrer">
                CCTP Official Documentation ↗
              </a>
            </li>
            <li>
              <a className="docs-link" href="https://docs.arc.network/app-kit/bridge" target="_blank" rel="noopener noreferrer">
                Circle App Kit Bridge Kit Docs ↗
              </a>
            </li>
          </ul>

          <h2 className="docs-h2">Supported Routes</h2>
          <p className="docs-p">All routes are bidirectional. Currently active in Sparrow:</p>
          <div className="docs-routes-grid">
            {[
              ['Arc Testnet',       'Ethereum Sepolia'],
              ['Arc Testnet',       'Base Sepolia'],
              ['Arc Testnet',       'Arbitrum Sepolia'],
              ['Arc Testnet',       'Optimism Sepolia'],
              ['Ethereum Sepolia',  'Base Sepolia'],
              ['Ethereum Sepolia',  'Arbitrum Sepolia'],
              ['Ethereum Sepolia',  'Optimism Sepolia'],
              ['Base Sepolia',      'Arbitrum Sepolia'],
              ['Base Sepolia',      'Optimism Sepolia'],
              ['Arbitrum Sepolia',  'Optimism Sepolia'],
            ].map(([from, to]) => (
              <div key={from + to} className="docs-route-row">
                <span className="docs-route-chain">{from}</span>
                <span className="docs-route-arrow">↔</span>
                <span className="docs-route-chain">{to}</span>
              </div>
            ))}
          </div>

          <h2 className="docs-h2">Transfer Details</h2>
          <ul className="docs-ul">
            <li><strong>Protocol</strong> — CCTP v2 Fast Transfer</li>
            <li><strong>Transfer speed</strong> — approximately 20 seconds end-to-end</li>
            <li><strong>Forwarder fee</strong> — 0.2 USDC per transfer (Circle Forwarding Service)</li>
            <li><strong>Token</strong> — USDC only (native, not wrapped)</li>
          </ul>

          <h2 className="docs-h2">Bridge Flow in Sparrow</h2>
          <ol className="docs-ol">
            <li>Connect your wallet via RainbowKit</li>
            <li>Select the source and destination chain</li>
            <li>Enter the USDC amount to transfer</li>
            <li>Confirm — your wallet switches to the source chain automatically</li>
            <li>USDC is burned on the source chain</li>
            <li>Circle's attestation service confirms the burn (~20 seconds)</li>
            <li>Native USDC is minted on the destination chain to your address</li>
          </ol>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="docs-section">
          <h1 className="docs-h1">FAQ</h1>
          {[
            {
              q: 'Can I use real funds on Sparrow?',
              a: 'No. Sparrow currently operates exclusively on testnets. All tokens used are testnet tokens with no real monetary value. Never send mainnet assets to this application.',
            },
            {
              q: 'Which wallet should I use?',
              a: 'Always use a dedicated burn wallet or a freshly created wallet with no real funds. Never connect a wallet that holds mainnet assets.',
            },
            {
              q: 'Which networks are supported?',
              a: 'Currently Arc Testnet, Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, and Optimism Sepolia.',
            },
            {
              q: 'What tokens can I swap?',
              a: 'Currently USDC and EURC on Arc Testnet.',
            },
            {
              q: 'How fast are bridge transfers?',
              a: 'Using CCTP v2 Fast Transfer, bridges typically complete in approximately 20 seconds.',
            },
            {
              q: 'Is Sparrow open source?',
              a: (
                <>
                  Yes. The Sparrow DEX repository is publicly available at{' '}
                  <a className="docs-link" href="https://github.com/0xnnerB/sparrow-dex" target="_blank" rel="noopener noreferrer">
                    github.com/0xnnerB/sparrow-dex ↗
                  </a>
                </>
              ),
            },
            {
              q: 'What is the long-term vision for Sparrow?',
              a: 'Beyond swap and bridge, Sparrow is building an AI agent layer that will allow users to execute DeFi operations — swaps, bridges, programmable payments — through natural language via a chatbot interface connected to their wallet. This feature is currently in testing.',
            },
            {
              q: 'Who built Sparrow?',
              a: 'Sparrow was built by Brenno, an Arc Architect (Tier 2) participating in the Arc Architects Program, developed using vibe coding via Claude.',
            },
          ].map(({ q, a }) => (
            <div key={q} className="docs-faq-item">
              <div className="docs-faq-q">{q}</div>
              <div className="docs-faq-a">{a}</div>
            </div>
          ))}
        </section>

        {/* ── TEAM ── */}
        <section id="team" className="docs-section">
          <h1 className="docs-h1">Team</h1>
          <p className="docs-p">
            Sparrow is an independent project built by a single developer participating in the
            Arc Architects Program.
          </p>
          <div className="docs-team-card">
            <div className="docs-team-avatar">B</div>
            <div className="docs-team-info">
              <div className="docs-team-name">Brenno Keven</div>
              <div className="docs-team-role">Arc Architect — Tier 2 · Arc Architects Program</div>
              <p className="docs-team-bio">
                Passionate about building accessible DeFi infrastructure on USDC-first networks and
                exploring the intersection of AI agents and onchain finance. Sparrow was built using
                vibe coding methodology with Claude as AI pair programmer.
              </p>
              <div className="docs-team-links">
                <a className="docs-social-link" href="https://x.com/onnerB_" target="_blank" rel="noopener noreferrer">
                  <span className="docs-social-icon">𝕏</span>@onnerB_
                </a>
                <span className="docs-social-link docs-social-static">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{flexShrink:0}}><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.031.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                  .onnerb
                </span>
                <a className="docs-social-link" href="https://github.com/0xnnerB" target="_blank" rel="noopener noreferrer">
                  <span className="docs-social-icon">⌥</span>0xnnerB
                </a>
                <span className="docs-social-link docs-social-static">
                  <span className="docs-social-icon">◆</span>Arc House
                </span>
              </div>
            </div>
          </div>
        </section>

      </main>
    </div>
  )
}

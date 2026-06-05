import { useState, useEffect } from 'react'

const SECTIONS = [
  { id: 'what-is-sparrow', label: 'What is Sparrow'  },
  { id: 'contracts',       label: 'Contracts'        },
  { id: 'swap',            label: 'How Swaps Work'   },
  { id: 'liquidity',       label: 'Liquidity'        },
  { id: 'bridge',          label: 'Bridge'           },
  { id: 'tokens',          label: 'Tokens'           },
  { id: 'faq',             label: 'FAQ'              },
  { id: 'team',            label: 'Team'             },
]

// Inline styles reused across contract/token tables
const tableWrap = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  overflow: 'hidden',
  margin: '12px 0 20px',
}
const tableRow = {
  display: 'flex',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 10,
  padding: '12px 18px',
  borderBottom: '1px solid rgba(255,255,255,0.05)',
  transition: 'background 0.15s',
}
const tableRowLast = { ...tableRow, borderBottom: 'none' }
const labelCell = {
  minWidth: 170,
  fontSize: '0.84rem',
  color: 'rgba(255,255,255,0.85)',
  fontWeight: 500,
}
const addrLink = {
  fontFamily: 'monospace',
  fontSize: '0.76rem',
  color: '#e91e8c',
  textDecoration: 'none',
  wordBreak: 'break-all',
  flex: 1,
}
const verifiedBadge = {
  fontSize: '0.65rem',
  color: '#4cff9f',
  background: 'rgba(76,255,159,0.1)',
  border: '1px solid rgba(76,255,159,0.25)',
  borderRadius: 4,
  padding: '2px 7px',
  flexShrink: 0,
  whiteSpace: 'nowrap',
}
const dimBadge = {
  ...verifiedBadge,
  color: 'rgba(255,255,255,0.35)',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
}
const hashBox = {
  background: 'rgba(0,0,0,0.25)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 8,
  padding: '10px 14px',
  fontFamily: 'monospace',
  fontSize: '0.72rem',
  color: 'rgba(255,255,255,0.6)',
  wordBreak: 'break-all',
  margin: '8px 0 20px',
}
const formulaBox = {
  background: 'rgba(233,30,140,0.06)',
  border: '1px solid rgba(233,30,140,0.18)',
  borderRadius: 10,
  padding: '16px 20px',
  margin: '12px 0 20px',
  textAlign: 'center',
  fontFamily: 'monospace',
  fontSize: '1.05rem',
  color: 'rgba(255,255,255,0.85)',
  letterSpacing: '0.5px',
}

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
            Sparrow is a fully onchain decentralized exchange (DEX) deployed on{' '}
            <strong>Arc Network</strong>, currently operating on testnet. It provides token swaps,
            liquidity provisioning, and cross-chain USDC bridging — all executed directly against
            smart contracts with no off-chain intermediaries in the swap path.
          </p>

          <h2 className="docs-h2">Core Features</h2>
          <ul className="docs-ul">
            <li>
              <strong>Onchain AMM Swaps</strong> — Swap USDC and EURC directly against Sparrow's
              own liquidity pools on Arc Testnet. No aggregators, no API quotes — pure onchain
              execution using the Uniswap V2 AMM model.
            </li>
            <li>
              <strong>Liquidity Provisioning</strong> — Add or remove liquidity from USDC/EURC
              pools and earn a 0.3% fee on every swap proportional to your pool share. Track your
              accumulated fees in real time under the Positions tab.
            </li>
            <li>
              <strong>Cross-Chain Bridge</strong> — Transfer USDC natively across supported testnets
              via Circle's Cross-Chain Transfer Protocol (CCTP v2). No wrapped tokens, no liquidity
              pools — native burn-and-mint.
            </li>
            <li>
              <strong>Wallet Connectivity</strong> — Connect via RainbowKit with MetaMask, Rabby,
              Coinbase Wallet, or any injected wallet.
            </li>
          </ul>

          <h2 className="docs-h2">Technology Stack</h2>
          <ul className="docs-ul">
            <li><strong>Sparrow Contracts</strong> — Uniswap V2 fork deployed on Arc Testnet (Factory, Router, Pair)</li>
            <li><strong>Viem + Wagmi</strong> — Onchain reads and transaction execution</li>
            <li><strong>RainbowKit</strong> — Wallet connection and chain management</li>
            <li><strong>Circle Bridge Kit + Adapter Viem v2</strong> — CCTP cross-chain USDC transfers</li>
            <li><strong>Arc Network</strong> — Primary settlement chain</li>
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
            without manual transaction flow navigation.
          </p>

          <h2 className="docs-h2">Philosophy</h2>
          <p className="docs-p">
            Sparrow is built around three principles: <strong>accessibility</strong> — removing
            friction from DeFi for newcomers and builders alike; <strong>transparency</strong> —
            open-source contracts and interface with no hidden routing or fees; and{' '}
            <strong>sovereignty</strong> — every swap executes against Sparrow's own onchain
            liquidity, with no dependency on external aggregators.
          </p>
        </section>

        {/* ── CONTRACTS ── */}
        <section id="contracts" className="docs-section">
          <h1 className="docs-h1">Contracts</h1>
          <p className="docs-p">
            All Sparrow contracts are deployed on Arc Testnet and verified on ArcScan. The
            contracts are a fork of Uniswap V2 with no modifications to the core AMM logic.
          </p>

          <h2 className="docs-h2">Network</h2>
          <div style={tableWrap}>
            {[
              { label: 'Network',  value: 'Arc Testnet' },
              { label: 'Chain ID', value: '5042002' },
              { label: 'RPC',      value: 'https://rpc.testnet.arc.network' },
              { label: 'Explorer', value: 'https://testnet.arcscan.app' },
            ].map(({ label, value }, i, arr) => (
              <div key={label} style={i === arr.length - 1 ? tableRowLast : tableRow}>
                <span style={labelCell}>{label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'rgba(255,255,255,0.55)' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          <h2 className="docs-h2">Deployed Contracts</h2>
          <div style={tableWrap}>
            {[
              {
                name: 'SparrowFactory',
                address: '0xe782DC843C7EBb44f819E8ebecb2b43F1311a3c8',
                verified: true,
                last: false,
              },
              {
                name: 'SparrowRouter',
                address: '0x5648Ff497C976F61c49f090Bec013cC76675b8a1',
                verified: true,
                last: false,
              },
              {
                name: 'Pool USDC/EURC',
                address: '0xDfa1C023c5AaE0F4594d8b96B4858aaFEefe9e7f',
                verified: true,
                last: true,
              },
            ].map(({ name, address, verified, last }) => (
              <div key={name} style={last ? tableRowLast : tableRow}>
                <span style={labelCell}>{name}</span>
                <a
                  href={`https://testnet.arcscan.app/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={addrLink}
                >
                  {address}
                </a>
                {verified && <span style={verifiedBadge}>✓ verified</span>}
              </div>
            ))}
          </div>

          <h2 className="docs-h2">INIT_CODE_HASH</h2>
          <p className="docs-p">
            The <code style={{ fontFamily: 'monospace', fontSize: '0.85em', color: 'rgba(255,255,255,0.7)' }}>INIT_CODE_HASH</code> is
            used to deterministically compute pair addresses off-chain using{' '}
            <code style={{ fontFamily: 'monospace', fontSize: '0.85em', color: 'rgba(255,255,255,0.7)' }}>CREATE2</code>. Required
            if you integrate with the SparrowRouter from another contract or script.
          </p>
          <div style={hashBox}>
            0x4e8d39999b57627d4401da6ddd2250f5a5f5392e685c871d977c597478d0529d
          </div>

          <h2 className="docs-h2">Source Code</h2>
          <ul className="docs-ul">
            <li>
              <a className="docs-link" href="https://github.com/0xnnerB/sparrow-dex" target="_blank" rel="noopener noreferrer">
                github.com/0xnnerB/sparrow-dex ↗
              </a>
            </li>
          </ul>
        </section>

        {/* ── HOW SWAPS WORK ── */}
        <section id="swap" className="docs-section">
          <h1 className="docs-h1">How Swaps Work</h1>
          <p className="docs-p">
            Sparrow swaps execute directly against onchain liquidity pools using an{' '}
            <strong>Automated Market Maker (AMM)</strong> — the same model pioneered by Uniswap V2.
            There are no order books, no off-chain quotes, and no intermediaries. Price is determined
            purely by the ratio of assets in the pool at the moment of execution.
          </p>

          <h2 className="docs-h2">The x·y = k Formula</h2>
          <p className="docs-p">
            Every Sparrow pool maintains two token reserves. The AMM enforces a single invariant:
            the product of the two reserves must remain constant after every trade.
          </p>
          <div style={formulaBox}>
            x · y = k
          </div>
          <p className="docs-p">
            Where <strong>x</strong> is the reserve of token A, <strong>y</strong> is the reserve of
            token B, and <strong>k</strong> is a constant. When you buy token B, you deposit token A
            into the pool, increasing x. To keep x·y = k, y must decrease — meaning the pool gives
            you fewer token B as your trade size grows relative to the pool.
          </p>

          <h2 className="docs-h2">The 0.3% Fee</h2>
          <p className="docs-p">
            Every swap pays a <strong>0.3% fee</strong> that stays inside the pool and accumulates
            as additional reserves. This fee is not extracted to a treasury — it compounds directly
            into the pool, increasing the value of all LP token holders over time.
          </p>
          <p className="docs-p">
            The fee is applied before the constant-product formula, meaning the effective amount
            going in is <strong>99.7%</strong> of what you send:
          </p>
          <div style={formulaBox}>
            amountOut = (amountIn × 997 × reserveOut) / (reserveIn × 1000 + amountIn × 997)
          </div>

          <h2 className="docs-h2">Price Impact</h2>
          <p className="docs-p">
            Because the AMM uses a curve rather than a fixed price, larger trades move the price
            more. <strong>Price impact</strong> is the difference between the mid-price (the ratio
            of reserves before your trade) and the actual execution price you receive.
          </p>
          <ul className="docs-ul">
            <li>Small trades relative to pool size → low price impact (&lt; 0.5%)</li>
            <li>Large trades relative to pool size → high price impact (can exceed 5%+)</li>
            <li>Sparrow displays price impact in real time and highlights it in red when above 5%</li>
            <li>All swaps include a 1% slippage tolerance — if the price moves more than 1% between
            submission and execution, the transaction reverts automatically</li>
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

          <h2 className="docs-h2">Step-by-Step Swap Flow</h2>
          <ol className="docs-ol">
            <li>Connect your wallet — Sparrow switches to Arc Testnet automatically if needed</li>
            <li>Select the input token (USDC or EURC) and enter an amount</li>
            <li>The interface reads live pool reserves onchain and computes the estimated output
            using the AMM formula with the 0.3% fee applied</li>
            <li>Rate, price impact, and route are displayed before confirmation</li>
            <li>If this is your first swap of that token, a one-time <strong>approve</strong> transaction
            is sent to the ERC-20 contract granting the Router permission to spend</li>
            <li>The swap transaction calls <code style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>swapExactTokensForTokens()</code> on
            the SparrowRouter</li>
            <li>Output tokens are delivered directly to your wallet in the same transaction</li>
          </ol>

          <h2 className="docs-h2">Technical Reference</h2>
          <ul className="docs-ul">
            <li>
              <a className="docs-link" href="https://uniswap.org/whitepaper.pdf" target="_blank" rel="noopener noreferrer">
                Uniswap V2 Whitepaper ↗
              </a>
            </li>
            <li>
              <a className="docs-link" href="https://testnet.arcscan.app/address/0x5648Ff497C976F61c49f090Bec013cC76675b8a1" target="_blank" rel="noopener noreferrer">
                SparrowRouter on ArcScan ↗
              </a>
            </li>
          </ul>
        </section>

        {/* ── LIQUIDITY ── */}
        <section id="liquidity" className="docs-section">
          <h1 className="docs-h1">Liquidity</h1>
          <p className="docs-p">
            Liquidity providers (LPs) deposit pairs of tokens into Sparrow pools and earn a share
            of every swap fee proportional to their contribution. Unlike staking or lending, LPs
            earn passively — fees accumulate inside the pool automatically with every swap.
          </p>

          <h2 className="docs-h2">LP Tokens (SPR-LP)</h2>
          <p className="docs-p">
            When you add liquidity, you receive <strong>SPR-LP tokens</strong> — ERC-20 tokens that
            represent your share of the pool. These tokens:
          </p>
          <ul className="docs-ul">
            <li>Accrue value as swap fees compound into the pool reserves</li>
            <li>Can be redeemed at any time by calling <code style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>removeLiquidity()</code></li>
            <li>Are transferable — whoever holds them owns the underlying position</li>
            <li>Have 18 decimals and are issued by the SparrowPair contract</li>
          </ul>

          <h2 className="docs-h2">Adding Liquidity</h2>
          <p className="docs-p">
            You always deposit <strong>both tokens at the current pool ratio</strong>. Sparrow
            calculates the required EURC amount automatically from your USDC input using the live
            reserve ratio. Depositing at ratio prevents arbitrage loss at entry.
          </p>
          <ol className="docs-ol">
            <li>Go to Liquidity → Add tab</li>
            <li>Enter the USDC amount — EURC is computed automatically</li>
            <li>Approve USDC and EURC spend if needed (one-time per token)</li>
            <li><code style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>addLiquidity()</code> is called on the SparrowRouter</li>
            <li>SPR-LP tokens are minted and sent to your wallet</li>
            <li>Your position snapshot is saved locally to track fee accumulation from this moment</li>
          </ol>

          <h2 className="docs-h2">Removing Liquidity</h2>
          <p className="docs-p">
            You can remove any percentage of your position at any time. The pool gives you back
            USDC and EURC proportional to your share of current reserves — which includes all
            accumulated fees since the pool launched.
          </p>
          <ol className="docs-ol">
            <li>Go to Liquidity → Remove tab</li>
            <li>Select a percentage (25% / 50% / 75% / 100%) or drag the slider</li>
            <li>Approve LP token spend if needed (one-time)</li>
            <li><code style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>removeLiquidity()</code> burns your SPR-LP tokens and returns USDC + EURC</li>
          </ol>

          <h2 className="docs-h2">Fee Accumulation Tracker</h2>
          <p className="docs-p">
            The <strong>Positions tab</strong> shows your current pool share and a real-time estimate
            of fees earned since you added liquidity. The fee calculation uses the{' '}
            <strong>√k growth method</strong>:
          </p>
          <div style={formulaBox}>
            feeGrowth = √(reserveUSDC<sub style={{fontSize:'0.7em'}}>now</sub> × reserveEURC<sub style={{fontSize:'0.7em'}}>now</sub>) − √(reserveUSDC<sub style={{fontSize:'0.7em'}}>entry</sub> × reserveEURC<sub style={{fontSize:'0.7em'}}>entry</sub>)
          </div>
          <p className="docs-p">
            This isolates actual swap fee income from impermanent loss, because <strong>k only
            grows when fees are collected</strong> — price movements shift reserves but keep k
            constant, while fees increase k. Your share of the fee growth is distributed
            proportionally to current reserve weights.
          </p>
          <p className="docs-p">
            The snapshot is stored locally in your browser and refreshes after each add/remove
            operation.
          </p>

          <h2 className="docs-h2">Impermanent Loss</h2>
          <p className="docs-p">
            When the price ratio between USDC and EURC changes after you deposit, your withdrawal
            value may be lower than if you had simply held the tokens — this is called{' '}
            <strong>impermanent loss</strong>. For stablecoin pairs (USDC/EURC), price divergence
            is historically minimal, making impermanent loss significantly lower than with volatile
            asset pairs.
          </p>
        </section>

        {/* ── BRIDGE ── */}
        <section id="bridge" className="docs-section">
          <h1 className="docs-h1">Bridge</h1>
          <p className="docs-p">
            Sparrow's bridge transfers USDC natively between supported test networks using Circle's{' '}
            <strong>Cross-Chain Transfer Protocol (CCTP) v2</strong>. CCTP is a burn-and-mint
            mechanism — no wrapped tokens, no liquidity pools, no counterparty risk.
          </p>

          <h2 className="docs-h2">How CCTP Works</h2>
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
              issues a cryptographic signature (~20 seconds)
            </li>
            <li>
              <strong>Mint</strong> — The signed attestation is submitted on the destination chain,
              where native USDC is minted to the recipient address
            </li>
          </ol>
          <p className="docs-p">
            The total USDC supply remains constant across all chains. There is no liquidity
            fragmentation and no slippage from pool depth.
          </p>

          <h2 className="docs-h2">Supported Routes</h2>
          <p className="docs-p">All routes are bidirectional.</p>
          <div className="docs-routes-grid">
            {[
              ['Arc Testnet',      'Ethereum Sepolia' ],
              ['Arc Testnet',      'Base Sepolia'     ],
              ['Arc Testnet',      'Arbitrum Sepolia' ],
              ['Arc Testnet',      'Optimism Sepolia' ],
              ['Ethereum Sepolia', 'Base Sepolia'     ],
              ['Ethereum Sepolia', 'Arbitrum Sepolia' ],
              ['Ethereum Sepolia', 'Optimism Sepolia' ],
              ['Base Sepolia',     'Arbitrum Sepolia' ],
              ['Base Sepolia',     'Optimism Sepolia' ],
              ['Arbitrum Sepolia', 'Optimism Sepolia' ],
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
            <li><strong>Protocol</strong> — CCTP v2 Fast Transfer via Circle Forwarding Service</li>
            <li><strong>Transfer speed</strong> — approximately 20 seconds end-to-end</li>
            <li><strong>Forwarder fee</strong> — 0.20 USDC (most routes) · 1.25 USDC (Ethereum Sepolia destination)</li>
            <li><strong>Token</strong> — USDC only (native, not wrapped)</li>
            <li><strong>Minimum amount</strong> — must exceed the forwarder fee</li>
          </ul>

          <h2 className="docs-h2">Bridge Flow in Sparrow</h2>
          <ol className="docs-ol">
            <li>Connect your wallet via RainbowKit</li>
            <li>Select the source and destination chain</li>
            <li>Enter the USDC amount — estimated received amount is shown after deducting the fee</li>
            <li>Optionally change the recipient address (defaults to your connected wallet)</li>
            <li>Confirm — your wallet switches to the source chain automatically</li>
            <li>USDC is burned on the source chain; Circle attests the burn (~20s)</li>
            <li>Native USDC is minted on the destination chain to the recipient address</li>
          </ol>

          <h2 className="docs-h2">References</h2>
          <ul className="docs-ul">
            <li>
              <a className="docs-link" href="https://developers.circle.com/stablecoins/cctp-getting-started" target="_blank" rel="noopener noreferrer">
                CCTP Official Documentation ↗
              </a>
            </li>
            <li>
              <a className="docs-link" href="https://www.npmjs.com/package/@circle-fin/bridge-kit" target="_blank" rel="noopener noreferrer">
                @circle-fin/bridge-kit on npm ↗
              </a>
            </li>
          </ul>
        </section>

        {/* ── TOKENS ── */}
        <section id="tokens" className="docs-section">
          <h1 className="docs-h1">Tokens</h1>
          <p className="docs-p">
            All tokens on Arc Testnet are testnet-only assets with no real monetary value.
          </p>

          <h2 className="docs-h2">Active</h2>
          <div style={tableWrap}>
            {[
              {
                symbol: 'USDC',
                name: 'USD Coin',
                address: '0x3600000000000000000000000000000000000000',
                decimals: '6',
                note: 'Native gas token on Arc Testnet',
                last: false,
              },
              {
                symbol: 'EURC',
                name: 'Euro Coin',
                address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
                decimals: '6',
                note: 'Circle Euro stablecoin',
                last: true,
              },
            ].map(({ symbol, name, address, decimals, note, last }) => (
              <div key={symbol} style={last ? tableRowLast : tableRow}>
                <span style={{ ...labelCell, minWidth: 80 }}>
                  <strong>{symbol}</strong>
                  <span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginLeft: 6 }}>{name}</span>
                </span>
                <a
                  href={`https://testnet.arcscan.app/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ ...addrLink, minWidth: 0 }}
                >
                  {address}
                </a>
                <span style={{ ...dimBadge, color: 'rgba(255,255,255,0.5)' }}>{decimals} dec</span>
              </div>
            ))}
          </div>

          <h2 className="docs-h2">Upcoming</h2>
          <div style={tableWrap}>
            <div style={tableRowLast}>
              <span style={{ ...labelCell, minWidth: 80 }}>
                <strong>cirBTC</strong>
                <span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginLeft: 6 }}>Circle BTC</span>
              </span>
              <a
                href="https://testnet.arcscan.app/address/0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF"
                target="_blank"
                rel="noopener noreferrer"
                style={{ ...addrLink, minWidth: 0 }}
              >
                0xf0C4a4CE82A5746AbAAd9425360Ab04fbBA432BF
              </a>
              <span style={dimBadge}>8 dec</span>
              <span style={dimBadge}>future</span>
            </div>
          </div>
          <p className="docs-p" style={{ marginTop: 4 }}>
            cirBTC support — including a USDC/cirBTC pool — is planned for a future release once
            sufficient testnet liquidity is available.
          </p>

          <h2 className="docs-h2">LP Token</h2>
          <div style={tableWrap}>
            <div style={tableRowLast}>
              <span style={{ ...labelCell, minWidth: 80 }}>
                <strong>SPR-LP</strong>
                <span style={{ fontWeight: 400, fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', marginLeft: 6 }}>Sparrow LP</span>
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'rgba(255,255,255,0.45)', flex: 1 }}>
                Issued by SparrowPair · ERC-20 · 18 decimals
              </span>
            </div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section id="faq" className="docs-section">
          <h1 className="docs-h1">FAQ</h1>
          {[
            {
              q: 'Can I use real funds on Sparrow?',
              a: 'No. Sparrow currently operates exclusively on testnets. All tokens are testnet assets with no real monetary value. Never send mainnet assets to this application.',
            },
            {
              q: 'Which wallet should I use?',
              a: 'Always use a dedicated testnet wallet with no real funds. Never connect a wallet that holds mainnet assets to a testnet application.',
            },
            {
              q: 'How is the swap price calculated?',
              a: 'Sparrow uses the Uniswap V2 AMM formula (x·y = k). Price is determined entirely by the ratio of reserves in the pool at the moment of your trade, with a 0.3% fee deducted before the formula is applied.',
            },
            {
              q: 'What is price impact?',
              a: 'Price impact is the difference between the current mid-price (reserve ratio) and the actual price you receive. Larger trades relative to pool size cause more price impact because they shift the reserve ratio more. Sparrow displays price impact before you confirm and warns when it exceeds 5%.',
            },
            {
              q: 'What is slippage tolerance?',
              a: 'Sparrow sets a 1% slippage tolerance on all swaps. If the price moves more than 1% between when you submit the transaction and when it is mined, the transaction reverts automatically and no funds are lost.',
            },
            {
              q: 'How do I earn fees as an LP?',
              a: 'Add liquidity in the Liquidity tab. You will receive SPR-LP tokens representing your pool share. Every swap in the pool pays a 0.3% fee that stays in the pool as additional reserves, increasing the value of your LP tokens over time. The Positions tab tracks your estimated fee earnings.',
            },
            {
              q: 'Which networks are supported?',
              a: 'Swaps: Arc Testnet only. Bridge: Arc Testnet, Ethereum Sepolia, Base Sepolia, Arbitrum Sepolia, and Optimism Sepolia.',
            },
            {
              q: 'How fast are bridge transfers?',
              a: 'Using CCTP v2 Fast Transfer, bridges typically complete in approximately 20 seconds end-to-end.',
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

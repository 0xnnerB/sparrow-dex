import { useState, useEffect } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useReadContract, useConnectorClient, useSwitchChain } from 'wagmi'
import { SwapKit } from '@circle-fin/swap-kit'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'
import BridgeCard from './BridgeCard'
import DisclaimerModal from './DisclaimerModal'
import DocsPage from './DocsPage'
import logoSw from './assets/logosw.png'
import './App.css'

const swapKit = new SwapKit()

const TOKENS = [
  { symbol: 'USDC', name: 'USD Coin', color: '#2775CA', address: '0x3600000000000000000000000000000000000000' },
  { symbol: 'EURC', name: 'Euro Coin', color: '#0052B4', address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' },
]

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
]

const SWAP_RATES = {
  'USDC-EURC': 0.92,
  'EURC-USDC': 1.08,
}

function useTokenBalance(tokenAddress, userAddress) {
  const { data } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
    query: { enabled: !!userAddress },
  })
  if (!data) return '—'
  return (Number(data) / 1e6).toFixed(2)
}

function SwapCard() {
  const { isConnected, address } = useAccount()
  const { data: connectorClient } = useConnectorClient()
  const { switchChainAsync } = useSwitchChain()
  const [tokenIn, setTokenIn] = useState(TOKENS[0])
  const [tokenOut, setTokenOut] = useState(TOKENS[1])
  const [amountIn, setAmountIn] = useState('')
  const [isSwapping, setIsSwapping] = useState(false)
  const [txResult, setTxResult] = useState(null)
  const [error, setError] = useState(null)
  const [showDropdownIn, setShowDropdownIn] = useState(false)
  const [showDropdownOut, setShowDropdownOut] = useState(false)

  const balanceIn  = useTokenBalance(tokenIn.address, address)
  const balanceOut = useTokenBalance(tokenOut.address, address)

  const rateKey      = `${tokenIn.symbol}-${tokenOut.symbol}`
  const rate         = SWAP_RATES[rateKey] || 1
  const amountNum    = parseFloat(amountIn) || 0
  const estimatedOut = amountNum > 0 ? (amountNum * rate).toFixed(2) : ''

  const handleFlip = () => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setAmountIn('')
    setTxResult(null)
    setError(null)
  }

  const handleSwap = async () => {
    if (!isConnected || !amountIn || !connectorClient) return
    setIsSwapping(true)
    setTxResult(null)
    setError(null)

    try {
      // Garante que a carteira (MetaMask, Rabby, etc.) está na Arc Testnet
      await switchChainAsync({ chainId: 5042002 })

      // Usa o provider da carteira conectada via wagmi — funciona com qualquer wallet
      const provider = connectorClient?.transport?.value?.provider ?? connectorClient?.transport
      const adapter = await createViemAdapterFromProvider({ provider })

      const result = await swapKit.swap({
        from: { adapter, chain: 'Arc_Testnet' },
        tokenIn: tokenIn.symbol,
        tokenOut: tokenOut.symbol,
        amountIn,
        config: {
          // Dummy que passa a validação local do SDK (regex KIT_KEY:<id>:<secret>).
          // A key real é injetada pelo backend proxy no Authorization header —
          // o SDK envia o apiKey apenas via Bearer, nunca no body ou query params.
          kitKey: 'KIT_KEY:proxy:injected',
        },
      })

      if (result?.state === 'error') {
        setError('Swap falhou. Verifique seu saldo e tente novamente.')
        return
      }

      setTxResult(result)
    } catch (err) {
      setError(err.message || 'Swap falhou')
    } finally {
      setIsSwapping(false)
    }
  }

  return (
    <div className="swap-card">
      <div className="swap-card-header">
        <span className="swap-label">Swap</span>
        <button className="settings-btn">⚙</button>
      </div>

      <div className="token-box">
        <div className="token-box-top">
          <span className="token-box-label">You pay</span>
          <span className="token-balance">Balance: {balanceIn} {tokenIn.symbol}</span>
        </div>
        <div className="token-box-row">
          <input
            className="amount-input"
            type="number"
            placeholder="0.00"
            value={amountIn}
            onChange={e => { setAmountIn(e.target.value); setTxResult(null); setError(null) }}
          />
          <div className="token-selector" onClick={() => setShowDropdownIn(!showDropdownIn)}>
            <span className="token-dot" style={{ background: tokenIn.color }} />
            <span>{tokenIn.symbol}</span>
            <span className="chevron">▾</span>
            {showDropdownIn && (
              <div className="token-dropdown">
                {TOKENS.filter(t => t.symbol !== tokenOut.symbol).map(t => (
                  <div key={t.symbol} className="token-option" onClick={() => { setTokenIn(t); setShowDropdownIn(false) }}>
                    <span className="token-dot" style={{ background: t.color }} />
                    {t.symbol}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flip-container">
        <button className="flip-btn" onClick={handleFlip}>⇅</button>
      </div>

      <div className="token-box">
        <div className="token-box-top">
          <span className="token-box-label">You receive</span>
          <span className="token-balance">Balance: {balanceOut} {tokenOut.symbol}</span>
        </div>
        <div className="token-box-row">
          <input
            className="amount-input"
            type="number"
            placeholder="0.00"
            value={estimatedOut}
            readOnly
          />
          <div className="token-selector" onClick={() => setShowDropdownOut(!showDropdownOut)}>
            <span className="token-dot" style={{ background: tokenOut.color }} />
            <span>{tokenOut.symbol}</span>
            <span className="chevron">▾</span>
            {showDropdownOut && (
              <div className="token-dropdown">
                {TOKENS.filter(t => t.symbol !== tokenIn.symbol).map(t => (
                  <div key={t.symbol} className="token-option" onClick={() => { setTokenOut(t); setShowDropdownOut(false) }}>
                    <span className="token-dot" style={{ background: t.color }} />
                    {t.symbol}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {amountIn && !txResult && (
        <>
          <div className="swap-info">
            <span>Rate</span>
            <span>1 {tokenIn.symbol} ≈ {rate} {tokenOut.symbol}</span>
          </div>
          <div className="swap-info">
            <span>Route</span>
            <span>{tokenIn.symbol} → {tokenOut.symbol} via Arc</span>
          </div>
        </>
      )}

      {error && <div className="swap-error">⚠ {error}</div>}

      {txResult && (
        <div className="swap-success">
          <div className="swap-success-title">✓ Swap concluído!</div>
          <div className="swap-success-row">
            <span>Enviado</span>
            <span>{txResult.amountIn} {txResult.tokenIn}</span>
          </div>
          <div className="swap-success-row">
            <span>Recebido</span>
            <span>≈ {estimatedOut} {txResult.tokenOut}</span>
          </div>
          {txResult.explorerUrl && (
            <a href={txResult.explorerUrl} target="_blank" rel="noopener noreferrer" className="explorer-link">
              Ver no Explorer →
            </a>
          )}
        </div>
      )}

      {!isConnected ? (
        <div className="connect-wrapper">
          <ConnectButton label="Connect Wallet to Swap" />
        </div>
      ) : (
        <button
          className={`swap-btn ${isSwapping ? 'swapping' : ''}`}
          onClick={handleSwap}
          disabled={!amountIn || isSwapping}
        >
          {isSwapping ? 'Processando swap...' : amountIn ? `Swap ${tokenIn.symbol} → ${tokenOut.symbol}` : 'Enter an amount'}
        </button>
      )}

      {isConnected && (
        <div className="wallet-info">
          Conectado: {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
      )}
    </div>
  )
}

export default function App() {
  const [page, setPage] = useState('home')
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="app">
      <DisclaimerModal />
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="nav-logo" onClick={() => setPage('home')}>
          <span className="nav-brand">SPARROW</span>
        </div>
        <div className="nav-links">
          <button className={`nav-link ${page === 'trade' ? 'active' : ''}`} onClick={() => setPage('trade')}>Trade</button>
          <button className="nav-link disabled">Liquidity</button>
          <button className={`nav-link ${page === 'bridge' ? 'active' : ''}`} onClick={() => setPage('bridge')}>Bridge</button>
          <button className="nav-link nav-link-bot">
            <img src={logoSw} alt="sparrow" style={{height:'16px',width:'auto',marginRight:'6px',verticalAlign:'middle'}} />
            SparrowBot
          </button>
        </div>
        <div className="nav-right">
          {page === 'home' ? (
            <button className="launch-btn" onClick={() => setPage('trade')}>Launch App</button>
          ) : (
            <ConnectButton />
          )}
        </div>
      </nav>

      {page === 'home' && (
        <div className="hero">
          <video
            className="hero-video"
            src="https://res.cloudinary.com/dhhxouhta/video/upload/v1777936640/magnific_d-um-leve-movimento-de-flutuao-a-logo-do-pssaro-en_kling_1080p_16-9_24fps_90642_cev8s4.mp4"
            autoPlay
            loop
            muted
            playsInline
          />
          <div className="hero-overlay" />
          <div className="hero-content">
            <div className="hero-text">
              <h1 className="hero-title">SPARROW</h1>
              <p className="hero-subtitle">SWAP FREELY ON ARC NETWORK</p>
              <p className="hero-desc">
                Currently only Arc Testnet.<br />
                Swap USDC and EURC with confidence.
              </p>
              <div className="hero-btns">
                <button className="btn-primary" onClick={() => setPage('trade')}>◆ Launch App</button>
                <button className="btn-secondary" onClick={() => setPage('docs')}>○ Explore Docs</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {page === 'trade' && (
        <div className="trade-page">
          <div className="trade-bg" />
          <div className="trade-content">
            <div className="trade-header">
              <h2 className="trade-title">Trade</h2>
              <p className="trade-subtitle">Swap tokens on Arc Testnet</p>
            </div>
            <SwapCard />
          </div>
        </div>
      )}

      {page === 'bridge' && (
        <div className="trade-page">
          <div className="trade-bg" />
          <div className="trade-content">
            <div className="trade-header">
              <h2 className="trade-title">Bridge</h2>
              <p className="trade-subtitle">Transfer USDC between testnets via CCTP</p>
            </div>
            <BridgeCard />
          </div>
        </div>
      )}

      {page === 'docs' && <DocsPage setPage={setPage} />}
    </div>
  )
}
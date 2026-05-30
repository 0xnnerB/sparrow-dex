import { useState, useMemo } from 'react'
import { GlassConnectButton } from './GlassConnectButton'
import { useAccount, useReadContract, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import BridgeCard from './BridgeCard'
import LiquidityCard from './LiquidityCard'
import DisclaimerModal from './DisclaimerModal'
import DocsPage from './DocsPage'
import logoSw from './assets/logosw.png'
import './App.css'

// ── Sparrow DEX on-chain contracts ──────────────────────────────────────────
const SPARROW_ROUTER = '0x5648Ff497C976F61c49f090Bec013cC76675b8a1'
const SPARROW_POOL   = '0xDfa1C023c5AaE0F4594d8b96B4858aaFEefe9e7f'
const CHAIN_ID       = 5042002

const TOKENS = [
  { symbol: 'USDC', name: 'USD Coin',  color: '#2775CA', address: '0x3600000000000000000000000000000000000000' },
  { symbol: 'EURC', name: 'Euro Coin', color: '#0052B4', address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' },
]

// ── ABIs ─────────────────────────────────────────────────────────────────────
const ERC20_ABI = [
  { name: 'balanceOf', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ type: 'uint256' }] },
  { name: 'allowance', type: 'function', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    outputs: [{ type: 'uint256' }] },
  { name: 'approve', type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    outputs: [{ type: 'bool' }] },
]

const ROUTER_ABI = [
  { name: 'swapExactTokensForTokens', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'amountIn',     type: 'uint256' },
      { name: 'amountOutMin', type: 'uint256' },
      { name: 'path',         type: 'address[]' },
      { name: 'to',           type: 'address' },
      { name: 'deadline',     type: 'uint256' },
    ],
    outputs: [{ name: 'amounts', type: 'uint256[]' }] },
]

const PAIR_ABI = [
  { name: 'getReserves', type: 'function', stateMutability: 'view', inputs: [],
    outputs: [
      { name: 'reserve0',          type: 'uint112' },
      { name: 'reserve1',          type: 'uint112' },
      { name: 'blockTimestampLast', type: 'uint32'  },
    ] },
  { name: 'token0', type: 'function', stateMutability: 'view', inputs: [],
    outputs: [{ type: 'address' }] },
]

// ── Uniswap V2 AMM formula (0.3% fee) ────────────────────────────────────────
function computeAmountOut(amountIn, reserveIn, reserveOut) {
  if (!amountIn || !reserveIn || !reserveOut || reserveIn === 0n) return 0n
  const amountInWithFee = amountIn * 997n
  const numerator       = amountInWithFee * reserveOut
  const denominator     = reserveIn * 1000n + amountInWithFee
  return numerator / denominator
}

// ── Token balance hook ────────────────────────────────────────────────────────
function useTokenBalance(tokenAddress, userAddress) {
  const { data } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
    query: { enabled: !!userAddress },
  })
  if (!data) return '—'
  return Number(formatUnits(data, 6)).toFixed(2)
}

// ── SwapCard ──────────────────────────────────────────────────────────────────
function SwapCard() {
  const { isConnected, address } = useAccount()
  const { switchChainAsync }     = useSwitchChain()
  const publicClient             = usePublicClient({ chainId: CHAIN_ID })
  const { data: walletClient }   = useWalletClient()

  const [tokenIn,         setTokenIn]         = useState(TOKENS[0])
  const [tokenOut,        setTokenOut]        = useState(TOKENS[1])
  const [amountIn,        setAmountIn]        = useState('')
  const [isSwapping,      setIsSwapping]      = useState(false)
  const [txResult,        setTxResult]        = useState(null)
  const [error,           setError]           = useState(null)
  const [swapStatus,      setSwapStatus]      = useState('')
  const [showDropdownIn,  setShowDropdownIn]  = useState(false)
  const [showDropdownOut, setShowDropdownOut] = useState(false)

  const balanceIn  = useTokenBalance(tokenIn.address,  address)
  const balanceOut = useTokenBalance(tokenOut.address, address)

  // Live pool reserves
  const { data: reserves, refetch: refetchReserves } = useReadContract({
    address: SPARROW_POOL,
    abi: PAIR_ABI,
    functionName: 'getReserves',
    chainId: CHAIN_ID,
  })
  const { data: token0 } = useReadContract({
    address: SPARROW_POOL,
    abi: PAIR_ABI,
    functionName: 'token0',
    chainId: CHAIN_ID,
  })

  // Real-time estimated output using AMM formula
  const { estimatedOut, rate, priceImpact } = useMemo(() => {
    const amountNum = parseFloat(amountIn)
    if (!amountNum || !reserves || !token0) return { estimatedOut: '', rate: null, priceImpact: null }

    const isTokenInToken0 = tokenIn.address.toLowerCase() === token0.toLowerCase()
    const reserveIn  = isTokenInToken0 ? reserves[0] : reserves[1]
    const reserveOut = isTokenInToken0 ? reserves[1] : reserves[0]

    // Truncate to 6 decimals to avoid parseUnits overflow
    const amountInBig = parseUnits(parseFloat(amountIn).toFixed(6), 6)
    const outBig      = computeAmountOut(amountInBig, reserveIn, reserveOut)
    const out         = Number(formatUnits(outBig, 6))
    if (out <= 0) return { estimatedOut: '', rate: null, priceImpact: null }

    // Price impact: compare to mid-price (reserveOut/reserveIn)
    const midPrice   = Number(reserveOut) / Number(reserveIn)
    const execPrice  = out / amountNum
    const impact     = ((midPrice - execPrice) / midPrice) * 100

    return {
      estimatedOut: out.toFixed(6),
      rate:         (out / amountNum).toFixed(4),
      priceImpact:  impact.toFixed(2),
    }
  }, [amountIn, reserves, token0, tokenIn])

  const handleFlip = () => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setAmountIn('')
    setTxResult(null)
    setError(null)
  }

  const handleSwap = async () => {
    if (!isConnected || !amountIn || !walletClient || !address || !publicClient || !estimatedOut) return
    setIsSwapping(true)
    setTxResult(null)
    setError(null)
    setSwapStatus('')

    try {
      await switchChainAsync({ chainId: CHAIN_ID })

      const amountInParsed = parseUnits(parseFloat(amountIn).toFixed(6), 6)
      const amountOutMin   = parseUnits((parseFloat(estimatedOut) * 0.99).toFixed(6), 6)
      const deadline       = BigInt(Math.floor(Date.now() / 1000) + 600)

      // Step 1: approve if allowance is insufficient
      const allowance = await publicClient.readContract({
        address: tokenIn.address,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, SPARROW_ROUTER],
      })

      if (allowance < amountInParsed) {
        setSwapStatus('Aguardando aprovação na carteira...')
        const approveTxHash = await walletClient.writeContract({
          address: tokenIn.address,
          abi: ERC20_ABI,
          functionName: 'approve',
          args: [SPARROW_ROUTER, BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')],
          account: address,
        })
        setSwapStatus('Confirmando aprovação...')
        await publicClient.waitForTransactionReceipt({ hash: approveTxHash })
      }

      // Step 2: swap
      setSwapStatus('Aguardando confirmação na carteira...')
      const swapTxHash = await walletClient.writeContract({
        address: SPARROW_ROUTER,
        abi: ROUTER_ABI,
        functionName: 'swapExactTokensForTokens',
        args: [
          amountInParsed,
          amountOutMin,
          [tokenIn.address, tokenOut.address],
          address,
          deadline,
        ],
        account: address,
      })

      setSwapStatus('Processando transação...')
      const receipt = await publicClient.waitForTransactionReceipt({ hash: swapTxHash })

      setTxResult({
        hash:         receipt.transactionHash,
        amountIn,
        tokenIn:      tokenIn.symbol,
        tokenOut:     tokenOut.symbol,
        estimatedOut,
      })
      refetchReserves()

    } catch (err) {
      const msg = err.shortMessage || err.message || ''
      if (msg.toLowerCase().includes('user rejected') || err.code === 4001) {
        setError('Transação cancelada.')
      } else {
        setError(msg || 'Swap falhou')
      }
    } finally {
      setIsSwapping(false)
      setSwapStatus('')
    }
  }

  return (
    <div className="swap-card">
      <div className="swap-card-header">
        <span className="swap-label">Swap</span>
        <button className="settings-btn">⚙</button>
      </div>

      {/* YOU PAY */}
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
                  <div key={t.symbol} className="token-option"
                    onClick={() => { setTokenIn(t); setShowDropdownIn(false) }}>
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

      {/* YOU RECEIVE */}
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
                  <div key={t.symbol} className="token-option"
                    onClick={() => { setTokenOut(t); setShowDropdownOut(false) }}>
                    <span className="token-dot" style={{ background: t.color }} />
                    {t.symbol}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Swap info rows */}
      {amountIn && estimatedOut && !txResult && (
        <>
          <div className="swap-info">
            <span>Rate</span>
            <span>1 {tokenIn.symbol} ≈ {rate} {tokenOut.symbol}</span>
          </div>
          <div className="swap-info">
            <span>Price impact</span>
            <span style={{ color: parseFloat(priceImpact) > 5 ? '#ff6b6b' : 'inherit' }}>
              {priceImpact}%
            </span>
          </div>
          <div className="swap-info">
            <span>Route</span>
            <span>{tokenIn.symbol} → {tokenOut.symbol} via Sparrow</span>
          </div>
        </>
      )}

      {swapStatus && <div className="swap-status">⏳ {swapStatus}</div>}
      {error     && <div className="swap-error">⚠ {error}</div>}

      {txResult && (
        <div className="swap-success">
          <div className="swap-success-title">✓ Swap concluído!</div>
          <div className="swap-success-row">
            <span>Enviado</span>
            <span>{txResult.amountIn} {txResult.tokenIn}</span>
          </div>
          <div className="swap-success-row">
            <span>Recebido</span>
            <span>≈ {txResult.estimatedOut} {txResult.tokenOut}</span>
          </div>
          <a
            href={`https://testnet.arcscan.app/tx/${txResult.hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="explorer-link"
          >
            Ver no Explorer →
          </a>
        </div>
      )}

      {!isConnected ? (
        <div className="connect-wrapper">
          <GlassConnectButton label="Connect Wallet to Swap" />
        </div>
      ) : (
        <button
          className={`swap-btn ${isSwapping ? 'swapping' : ''}`}
          onClick={handleSwap}
          disabled={!amountIn || isSwapping || !estimatedOut}
        >
          {isSwapping
            ? (swapStatus || 'Processando...')
            : amountIn
              ? `Swap ${tokenIn.symbol} → ${tokenOut.symbol}`
              : 'Enter an amount'}
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

  return (
    <div className="app">
      <DisclaimerModal />
      <video
        className="trade-bg"
        src="https://res.cloudinary.com/dhhxouhta/video/upload/v1779835200/background_qxygbv.mp4"
        autoPlay
        loop
        muted
        playsInline
      />
      <nav className="navbar">
        <div className="nav-logo" onClick={() => setPage('home')}>
          <span className="nav-brand">SPARROW</span>
        </div>
        <div className="nav-links">
          <button className={`nav-link ${page === 'trade' ? 'active' : ''}`} onClick={() => setPage('trade')}>Trade</button>
          <button className={`nav-link ${page === 'liquidity' ? 'active' : ''}`} onClick={() => setPage('liquidity')}>Liquidity</button>
          <button className={`nav-link ${page === 'bridge' ? 'active' : ''}`} onClick={() => setPage('bridge')}>Bridge</button>
          <button className="nav-link nav-link-bot disabled">
            <img src={logoSw} alt="sparrow" style={{height:'16px',width:'auto',marginRight:'6px',verticalAlign:'middle'}} />
            SparrowBot
          </button>
        </div>
        <div className="nav-right">
          {page === 'home' ? (
            <button className="launch-btn" onClick={() => setPage('trade')}>Launch App</button>
          ) : (
            <GlassConnectButton />
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
          <div className="trade-content">
            <div className="trade-header">
              <h2 className="trade-title">Trade</h2>
              <p className="trade-subtitle">Swap tokens on Arc Testnet</p>
            </div>
            <SwapCard />
          </div>
        </div>
      )}

      {page === 'liquidity' && (
        <div className="trade-page">
          <div className="trade-content">
            <div className="trade-header">
              <h2 className="trade-title">Liquidity</h2>
              <p className="trade-subtitle">Add or remove liquidity on Arc Testnet</p>
            </div>
            <LiquidityCard />
          </div>
        </div>
      )}

      {page === 'bridge' && (
        <div className="trade-page">
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

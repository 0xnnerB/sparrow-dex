import './bridge.css'
import { useState, useEffect } from 'react'
import { GlassConnectButton } from './GlassConnectButton'
import { useAccount, useReadContract, useConnectorClient, useSwitchChain } from 'wagmi'
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2'
import { BridgeKit } from '@circle-fin/bridge-kit'

const bridgeKit = new BridgeKit()

const CHAIN_IDS = {
  Arc_Testnet:      5042002,
  Ethereum_Sepolia: 11155111,
  Base_Sepolia:     84532,
  Arbitrum_Sepolia: 421614,
  Optimism_Sepolia: 11155420,
}

const USDC_ADDRESSES = {
  Arc_Testnet:      '0x3600000000000000000000000000000000000000',
  Ethereum_Sepolia: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  Base_Sepolia:     '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  Arbitrum_Sepolia: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d',
  Optimism_Sepolia: '0x5fd84259d66Cd46123540766Be93DFE6D43130D7',
  Solana_Devnet:    null,
}

const CHAIN_ICONS = {
  Arc_Testnet:      'https://s2.coinmarketcap.com/static/img/coins/64x64/3408.png',
  Ethereum_Sepolia: 'https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png',
  Base_Sepolia:     'https://s2.coinmarketcap.com/static/img/coins/64x64/27716.png',
  Arbitrum_Sepolia: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11841.png',
  Optimism_Sepolia: 'https://s2.coinmarketcap.com/static/img/coins/64x64/11840.png',
  Solana_Devnet:    'https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png',
}

const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
]

const STEP_ICONS = {
  approve:          { label: 'Approve',     icon: '✓'  },
  burn:             { label: 'Burn',        icon: '🔥' },
  fetchAttestation: { label: 'Attestation', icon: '🔏' },
  mint:             { label: 'Mint',        icon: '✦'  },
}

function useUSDCBalance(chainId, userAddress) {
  const tokenAddress = USDC_ADDRESSES[chainId]
  const { data } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: [userAddress],
    query: { enabled: !!userAddress && !!tokenAddress },
  })
  if (!data) return '—'
  return (Number(data) / 1e6).toFixed(2)
}

function ChainIcon({ chainId, size = 22 }) {
  const src = CHAIN_ICONS[chainId]
  if (!src) return <span className="chain-dot" />
  return (
    <img
      src={src}
      alt={chainId}
      width={size}
      height={size}
      style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      onError={e => { e.target.style.display = 'none' }}
    />
  )
}

function StepTracker({ steps }) {
  if (!steps?.length) return null
  return (
    <div className="bridge-steps">
      {steps.map((step, i) => {
        const meta      = STEP_ICONS[step.name] || { label: step.name, icon: '•' }
        const isSuccess = step.state === 'success'
        const isError   = step.state === 'error'
        const isPending = step.state === 'pending' || step.state === 'loading'
        return (
          <div key={i} className={`bridge-step ${isSuccess ? 'success' : isError ? 'error' : isPending ? 'pending' : ''}`}>
            <span className="bridge-step-icon">{isPending ? '⟳' : isError ? '✗' : meta.icon}</span>
            <span className="bridge-step-label">{meta.label}</span>
            {step.txHash && (
              <a className="bridge-step-tx" href={step.explorerUrl || '#'} target="_blank" rel="noopener noreferrer">
                {step.txHash.slice(0, 8)}…
              </a>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function BridgeCard() {
  const { isConnected, address } = useAccount()
  const { data: connectorClient } = useConnectorClient()
  const { switchChainAsync } = useSwitchChain()

  const [chains, setChains]           = useState([])
  const [sourceChain, setSourceChain] = useState('')
  const [destChain, setDestChain]     = useState('')
  const [amount, setAmount]           = useState('')
  const [recipient, setRecipient]     = useState('')
  const [useMyWallet, setUseMyWallet] = useState(true)
  const [isBridging, setIsBridging]   = useState(false)
  const [steps, setSteps]             = useState([])
  const [txResult, setTxResult]       = useState(null)
  const [error, setError]             = useState(null)
  const [showSrcDrop, setShowSrcDrop] = useState(false)
  const [showDstDrop, setShowDstDrop] = useState(false)

  const balanceSrc = useUSDCBalance(sourceChain, address)

  useEffect(() => {
    fetch('https://sparrow-dex-backend.onrender.com/bridge/chains')
      .then(r => r.json())
      .then(d => {
        if (d.success && d.chains.length) {
          setChains(d.chains)
          setSourceChain(d.chains[0].id)
          setDestChain(d.chains[1].id)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (useMyWallet && address) setRecipient(address)
    else if (!useMyWallet) setRecipient('')
  }, [useMyWallet, address])

  const reset = () => {
    setAmount('')
    setTxResult(null)
    setError(null)
    setSteps([])
  }

  const handleFlip = () => {
    const dst = chains.find(c => c.id === destChain)
    if (dst?.type === 'solana') return
    const tmp = sourceChain
    setSourceChain(destChain)
    setDestChain(tmp)
    reset()
  }

  const forwarderFee = destChain === 'Ethereum_Sepolia' ? 1.25 : 0.20
  const amountNum    = parseFloat(amount) || 0
  const willReceive  = amountNum > forwarderFee ? (amountNum - forwarderFee).toFixed(2) : '—'
  const canBridge    = isConnected && amountNum > 0 && sourceChain && destChain && recipient

  const srcChain = chains.find(c => c.id === sourceChain)
  const dstChain = chains.find(c => c.id === destChain)
  const dstIsSol = dstChain?.type === 'solana'

  const handleMaxAmount = () => {
    if (balanceSrc !== '—') {
      const max = Math.max(0, parseFloat(balanceSrc) - forwarderFee).toFixed(2)
      setAmount(max)
    }
  }

  const handleBridge = async () => {
    if (!canBridge || !connectorClient) return
    setIsBridging(true)
    setTxResult(null)
    setError(null)
    setSteps([
      { name: 'approve',          state: 'pending' },
      { name: 'burn',             state: 'pending' },
      { name: 'fetchAttestation', state: 'pending' },
      { name: 'mint',             state: 'pending' },
    ])

    try {
      // Muda para a chain de origem na carteira do usuário
      const srcChainId = CHAIN_IDS[sourceChain]
      if (srcChainId) {
        await switchChainAsync({ chainId: srcChainId })
      }

      // Cria o adapter com o provider da carteira do USUÁRIO
      const provider = connectorClient?.transport?.value?.provider ?? connectorClient?.transport
      const adapter  = await createViemAdapterFromProvider({ provider })

      // Executa o bridge com a carteira do usuário — Forwarding Service cuida do destino
      const result = await bridgeKit.bridge({
        from: { adapter, chain: sourceChain },
        to: {
          recipientAddress: recipient,
          chain: destChain,
          useForwarder: true,
        },
        amount: amountNum.toFixed(2),
      })

      setSteps(result.steps || [])

      if (result.state === 'error') {
        const failedStep = result.steps?.find(s => s.state === 'error')
        setError(`Bridge falhou na etapa "${failedStep?.name}": ${failedStep?.error}`)
      } else {
        setTxResult(result)
      }
    } catch (err) {
      setError(err.message || 'Erro ao executar o bridge')
      setSteps([])
    } finally {
      setIsBridging(false)
    }
  }

  return (
    <div className="swap-card">
      <div className="swap-card-header">
        <span className="swap-label">Bridge</span>
        <span className="bridge-badge">CCTP</span>
      </div>

      {/* FROM */}
      <div className="token-box">
        <div className="token-box-top">
          <span className="token-box-label">You send</span>
          <span className="token-balance">
            Balance: {balanceSrc} USDC
            {balanceSrc !== '—' && (
              <button className="bridge-max-btn" onClick={handleMaxAmount}>MAX</button>
            )}
          </span>
        </div>
        <div className="token-box-row">
          <input
            className="amount-input"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={e => { setAmount(e.target.value); setTxResult(null); setError(null) }}
          />
          <div className="token-selector" onClick={() => { setShowSrcDrop(!showSrcDrop); setShowDstDrop(false) }}>
            <ChainIcon chainId={sourceChain} size={20} />
            <span>{srcChain?.label || '...'}</span>
            <span className="chevron">▾</span>
            {showSrcDrop && (
              <div className="token-dropdown">
                {chains
                  .filter(c => c.id !== destChain && c.type !== 'solana')
                  .map(c => (
                    <div key={c.id} className="token-option" onClick={() => { setSourceChain(c.id); setShowSrcDrop(false); reset() }}>
                      <ChainIcon chainId={c.id} size={18} />
                      <span>{c.label}</span>
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FLIP */}
      <div className="flip-container">
        <button className="flip-btn" onClick={handleFlip} disabled={dstIsSol}>⇅</button>
      </div>

      {/* TO */}
      <div className="token-box">
        <div className="token-box-top">
          <span className="token-box-label">You receive</span>
          {amountNum > 0 && <span className="token-balance">≈ {willReceive} USDC</span>}
        </div>
        <div className="token-box-row">
          <input
            className="amount-input"
            type="number"
            placeholder="0.00"
            value={willReceive === '—' ? '' : willReceive}
            readOnly
          />
          <div className="token-selector" onClick={() => { setShowDstDrop(!showDstDrop); setShowSrcDrop(false) }}>
            <ChainIcon chainId={destChain} size={20} />
            <span>{dstChain?.label || '...'}</span>
            <span className="chevron">▾</span>
            {showDstDrop && (
              <div className="token-dropdown">
                {chains
                  .filter(c => c.id !== sourceChain)
                  .map(c => (
                    <div key={c.id} className="token-option" onClick={() => { setDestChain(c.id); setShowDstDrop(false); reset() }}>
                      <ChainIcon chainId={c.id} size={18} />
                      <span>{c.label}</span>
                      {c.type === 'solana' && <span className="bridge-sol-badge">SOL</span>}
                    </div>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RECIPIENT */}
      <div className="bridge-recipient">
        <div className="bridge-recipient-top">
          <span className="token-box-label">Recipient</span>
          {isConnected && (
            <button
              className={`bridge-my-wallet-btn ${useMyWallet ? 'active' : ''}`}
              onClick={() => setUseMyWallet(!useMyWallet)}
            >
              {useMyWallet ? '✓ My Wallet' : 'Use My Wallet'}
            </button>
          )}
        </div>
        <input
          className="bridge-address-input"
          type="text"
          placeholder={dstIsSol ? 'Solana address (base58)' : '0x... endereço de destino'}
          value={recipient}
          onChange={e => { setRecipient(e.target.value); setUseMyWallet(false) }}
          readOnly={useMyWallet && isConnected}
        />
      </div>

      {/* INFO */}
      {amountNum > 0 && (
        <>
          <div className="swap-info">
            <span>Forwarder fee</span>
            <span>{forwarderFee} USDC</span>
          </div>
          <div className="swap-info">
            <span>Protocol</span>
            <span>CCTP v2 · Fast (~20s)</span>
          </div>
        </>
      )}

      {steps.length > 0 && <StepTracker steps={steps} />}
      {error && <div className="swap-error">⚠ {error}</div>}

      {txResult && txResult.state === 'success' && (
        <div className="swap-success">
          <div className="swap-success-title">✓ Bridge concluído!</div>
          <div className="swap-success-row">
            <span>Enviado</span>
            <span>{txResult.amount} USDC · {srcChain?.label}</span>
          </div>
          <div className="swap-success-row">
            <span>Recebido</span>
            <span>{willReceive} USDC · {dstChain?.label}</span>
          </div>
          <div className="swap-success-row">
            <span>Destino</span>
            <span>{recipient.slice(0, 8)}…{recipient.slice(-6)}</span>
          </div>
        </div>
      )}

      {!isConnected ? (
        <div className="connect-wrapper">
          <GlassConnectButton label="Connect Wallet to Bridge" />
        </div>
      ) : (
        <button
          className={`swap-btn ${isBridging ? 'swapping' : ''}`}
          onClick={handleBridge}
          disabled={!canBridge || isBridging}
        >
          {isBridging
            ? 'Processando bridge...'
            : canBridge
              ? `Bridge ${amount} USDC · ${srcChain?.label} → ${dstChain?.label}`
              : 'Preencha os campos acima'}
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
import { useState, useMemo } from 'react'
import { useAccount, useReadContract, usePublicClient, useWalletClient, useSwitchChain } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'
import { GlassConnectButton } from './GlassConnectButton'
import './liquidity.css'

const SPARROW_ROUTER = '0x5648Ff497C976F61c49f090Bec013cC76675b8a1'
const SPARROW_POOL   = '0xDfa1C023c5AaE0F4594d8b96B4858aaFEefe9e7f'
const CHAIN_ID       = 5042002
const MAX_UINT256    = BigInt('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff')
// keccak256("Mint(address,uint256,uint256)") — Uniswap V2 Pair event
const MINT_TOPIC     = '0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f'

const USDC = { symbol: 'USDC', address: '0x3600000000000000000000000000000000000000', color: '#2775CA' }
const EURC = { symbol: 'EURC', address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a', color: '#0052B4' }

const ERC20_ABI = [
  { name: 'balanceOf',  type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'allowance',  type: 'function', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'approve',    type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
]

const PAIR_ABI = [
  { name: 'getReserves', type: 'function', stateMutability: 'view', inputs: [],
    outputs: [{ name: 'reserve0', type: 'uint112' }, { name: 'reserve1', type: 'uint112' }, { name: 'blockTimestampLast', type: 'uint32' }] },
  { name: 'token0',      type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'address' }] },
  { name: 'totalSupply', type: 'function', stateMutability: 'view', inputs: [], outputs: [{ type: 'uint256' }] },
  { name: 'balanceOf',   type: 'function', stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'allowance',   type: 'function', stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ type: 'uint256' }] },
  { name: 'approve',     type: 'function', stateMutability: 'nonpayable',
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ type: 'bool' }] },
]

const ROUTER_LIQUIDITY_ABI = [
  { name: 'addLiquidity', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenA',         type: 'address' }, { name: 'tokenB',         type: 'address' },
      { name: 'amountADesired', type: 'uint256' }, { name: 'amountBDesired', type: 'uint256' },
      { name: 'amountAMin',     type: 'uint256' }, { name: 'amountBMin',     type: 'uint256' },
      { name: 'to',             type: 'address' }, { name: 'deadline',       type: 'uint256' },
    ],
    outputs: [{ name: 'amountA', type: 'uint256' }, { name: 'amountB', type: 'uint256' }, { name: 'liquidity', type: 'uint256' }] },
  { name: 'removeLiquidity', type: 'function', stateMutability: 'nonpayable',
    inputs: [
      { name: 'tokenA',     type: 'address' }, { name: 'tokenB',     type: 'address' },
      { name: 'liquidity',  type: 'uint256' },
      { name: 'amountAMin', type: 'uint256' }, { name: 'amountBMin', type: 'uint256' },
      { name: 'to',         type: 'address' }, { name: 'deadline',   type: 'uint256' },
    ],
    outputs: [{ name: 'amountA', type: 'uint256' }, { name: 'amountB', type: 'uint256' }] },
]

// ── Helpers ──────────────────────────────────────────────────────────────────

function depositKey(addr) {
  return `sparrow_deposit_${SPARROW_POOL}_${addr}`
}

// Decode actual token amounts from the Mint event emitted by the pair contract
function decodeMintAmounts(receipt, isUSDCtoken0) {
  const mintLog = receipt.logs.find(log =>
    log.address.toLowerCase() === SPARROW_POOL.toLowerCase() &&
    log.topics[0] === MINT_TOPIC
  )
  if (!mintLog?.data || mintLog.data.length < 130) return null
  const raw     = mintLog.data.slice(2)
  const amount0 = BigInt('0x' + raw.slice(0, 64))
  const amount1 = BigInt('0x' + raw.slice(64, 128))
  return {
    usdcAmount: isUSDCtoken0 ? amount0 : amount1,
    eurcAmount: isUSDCtoken0 ? amount1 : amount0,
  }
}

// Build a snapshot record for localStorage (all values in display units as strings)
function buildSnapshot(resUSDC, resEURC, supply, lpBal, existing) {
  return {
    depositUSDC: existing.depositUSDC || '0',
    depositEURC: existing.depositEURC || '0',
    timestamp:   existing.timestamp || Date.now(),
    snapshotReserveUSDC: Number(formatUnits(resUSDC, 6)).toFixed(6),
    snapshotReserveEURC: Number(formatUnits(resEURC, 6)).toFixed(6),
    snapshotTotalSupply: Number(formatUnits(supply,  18)).toFixed(12),
    snapshotLPBalance:   Number(formatUnits(lpBal,   18)).toFixed(12),
  }
}

export default function LiquidityCard() {
  const [activeTab,      setActiveTab]      = useState('add')
  const [depositRefresh, setDepositRefresh] = useState(0)

  const { isConnected, address } = useAccount()
  const { switchChainAsync }     = useSwitchChain()
  const publicClient             = usePublicClient({ chainId: CHAIN_ID })
  const { data: walletClient }   = useWalletClient()

  // ── Pool reads ──────────────────────────────────────────────────────────────
  const { data: reserves,    refetch: refetchReserves }    = useReadContract({ address: SPARROW_POOL, abi: PAIR_ABI, functionName: 'getReserves',  chainId: CHAIN_ID })
  const { data: token0 }                                   = useReadContract({ address: SPARROW_POOL, abi: PAIR_ABI, functionName: 'token0',       chainId: CHAIN_ID })
  const { data: totalSupply, refetch: refetchTotalSupply } = useReadContract({ address: SPARROW_POOL, abi: PAIR_ABI, functionName: 'totalSupply',  chainId: CHAIN_ID })
  const { data: lpBalance,   refetch: refetchLpBalance }   = useReadContract({ address: SPARROW_POOL, abi: PAIR_ABI, functionName: 'balanceOf', args: [address], chainId: CHAIN_ID, query: { enabled: !!address } })
  const { data: usdcBal,     refetch: refetchUsdcBal }     = useReadContract({ address: USDC.address, abi: ERC20_ABI, functionName: 'balanceOf', args: [address], chainId: CHAIN_ID, query: { enabled: !!address } })
  const { data: eurcBal,     refetch: refetchEurcBal }     = useReadContract({ address: EURC.address, abi: ERC20_ABI, functionName: 'balanceOf', args: [address], chainId: CHAIN_ID, query: { enabled: !!address } })

  // Determine reserve order based on token0
  const { reserveUSDC, reserveEURC, isUSDCtoken0 } = useMemo(() => {
    if (!reserves || !token0) return { reserveUSDC: 0n, reserveEURC: 0n, isUSDCtoken0: true }
    const usdcFirst = USDC.address.toLowerCase() === token0.toLowerCase()
    return {
      reserveUSDC:  usdcFirst ? reserves[0] : reserves[1],
      reserveEURC:  usdcFirst ? reserves[1] : reserves[0],
      isUSDCtoken0: usdcFirst,
    }
  }, [reserves, token0])

  // Helper: extract reserves from a raw getReserves result respecting token0 order
  const splitReserves = (rawReserves) => {
    if (!rawReserves) return { rUSDC: reserveUSDC, rEURC: reserveEURC }
    return {
      rUSDC: isUSDCtoken0 ? rawReserves[0] : rawReserves[1],
      rEURC: isUSDCtoken0 ? rawReserves[1] : rawReserves[0],
    }
  }

  // ── Deposit tracker (localStorage) ─────────────────────────────────────────
  const depositData = useMemo(() => {
    const empty = {
      hasDeposit: false, since: null,
      snapshotReserveUSDC: 0, snapshotReserveEURC: 0,
      snapshotTotalSupply: 0, snapshotLPBalance: 0,
    }
    if (!address) return empty
    const saved = JSON.parse(localStorage.getItem(depositKey(address)) || '{}')
    if (!saved.snapshotLPBalance) return empty
    return {
      hasDeposit:  true,
      since:       saved.timestamp ? new Date(saved.timestamp).toLocaleString('pt-BR') : null,
      snapshotReserveUSDC: parseFloat(saved.snapshotReserveUSDC || 0),
      snapshotReserveEURC: parseFloat(saved.snapshotReserveEURC || 0),
      snapshotTotalSupply: parseFloat(saved.snapshotTotalSupply || 0),
      snapshotLPBalance:   parseFloat(saved.snapshotLPBalance   || 0),
    }
  }, [address, depositRefresh])

  // ── K-growth fee calculation (isolates real 0.3% swap fees from IL) ─────────
  // k = reserveUSDC * reserveEURC grows only when swaps collect fees.
  // sqrt(k) grows proportionally — user's fee = feeGrowth * shareAtDeposit,
  // distributed between USDC and EURC proportionally to current reserves.
  const { feesUSDC, feesEURC, noFees, totalPoolFeeUSDC, totalPoolFeeEURC } = useMemo(() => {
    const zero = { feesUSDC: '0.000000', feesEURC: '0.000000', noFees: true, totalPoolFeeUSDC: '0.000000', totalPoolFeeEURC: '0.000000' }
    if (!depositData.hasDeposit || !reserveUSDC || !reserveEURC) return zero

    const { snapshotReserveUSDC: snapRU, snapshotReserveEURC: snapRE,
            snapshotTotalSupply: snapLS,  snapshotLPBalance: snapLB } = depositData
    if (snapRU <= 0 || snapRE <= 0 || snapLS <= 0 || snapLB <= 0) return zero

    const curRU = Number(reserveUSDC) / 1e6   // current reserves in display units
    const curRE = Number(reserveEURC) / 1e6

    const shareAtDeposit = snapLB / snapLS     // user's LP share at time of snapshot

    const sqrtKAt  = Math.sqrt(snapRU * snapRE)
    const sqrtKNow = Math.sqrt(curRU  * curRE)

    const feeGrowth     = Math.max(0, sqrtKNow - sqrtKAt)   // total pool geometric-mean fee growth
    const userFeeGrowth = feeGrowth * shareAtDeposit

    // Distribute proportionally to current reserve weights
    const fUSDC = sqrtKNow > 0 ? Math.max(0, userFeeGrowth * curRU / sqrtKNow) : 0
    const fEURC = sqrtKNow > 0 ? Math.max(0, userFeeGrowth * curRE / sqrtKNow) : 0
    const tUSDC = sqrtKNow > 0 ? Math.max(0, feeGrowth     * curRU / sqrtKNow) : 0
    const tEURC = sqrtKNow > 0 ? Math.max(0, feeGrowth     * curRE / sqrtKNow) : 0

    return {
      feesUSDC: fUSDC.toFixed(6),
      feesEURC: fEURC.toFixed(6),
      noFees:   fUSDC === 0 && fEURC === 0,
      totalPoolFeeUSDC: tUSDC.toFixed(6),
      totalPoolFeeEURC: tEURC.toFixed(6),
    }
  }, [depositData, reserveUSDC, reserveEURC])

  // ── ADD TAB ─────────────────────────────────────────────────────────────────
  const [usdcInput,   setUsdcInput]   = useState('')
  const [addStatus,   setAddStatus]   = useState('')
  const [addError,    setAddError]    = useState(null)
  const [addTxResult, setAddTxResult] = useState(null)

  const { eurcNeeded, estimatedLP } = useMemo(() => {
    const amount = parseFloat(usdcInput)
    if (!amount || !reserveUSDC || reserveUSDC === 0n || !reserveEURC) return { eurcNeeded: '', estimatedLP: '' }
    const usdcBig = parseUnits(amount.toFixed(6), 6)
    const eurcBig = usdcBig * reserveEURC / reserveUSDC
    const eurc    = Number(formatUnits(eurcBig, 6)).toFixed(6)
    let lp = ''
    if (totalSupply && totalSupply > 0n) {
      const lpBig = usdcBig * totalSupply / reserveUSDC
      lp = Number(formatUnits(lpBig, 18)).toFixed(12)
    }
    return { eurcNeeded: eurc, estimatedLP: lp }
  }, [usdcInput, reserveUSDC, reserveEURC, totalSupply])

  const handleAddLiquidity = async () => {
    if (!isConnected || !usdcInput || !walletClient || !address || !publicClient || !eurcNeeded) return
    setAddError(null); setAddTxResult(null); setAddStatus('')
    try {
      await switchChainAsync({ chainId: CHAIN_ID })

      const usdcAmount = parseUnits(parseFloat(usdcInput).toFixed(6), 6)
      const eurcAmount = parseUnits(parseFloat(eurcNeeded).toFixed(6), 6)
      const usdcMin    = usdcAmount * 99n / 100n
      const eurcMin    = eurcAmount * 99n / 100n
      const deadline   = BigInt(Math.floor(Date.now() / 1000) + 600)

      // Approve USDC if needed
      const usdcAllowance = await publicClient.readContract({ address: USDC.address, abi: ERC20_ABI, functionName: 'allowance', args: [address, SPARROW_ROUTER] })
      if (usdcAllowance < usdcAmount) {
        setAddStatus('Aprovando USDC...')
        const tx = await walletClient.writeContract({ address: USDC.address, abi: ERC20_ABI, functionName: 'approve', args: [SPARROW_ROUTER, MAX_UINT256], account: address })
        setAddStatus('Confirmando aprovação USDC...')
        await publicClient.waitForTransactionReceipt({ hash: tx })
      }

      // Approve EURC if needed
      const eurcAllowance = await publicClient.readContract({ address: EURC.address, abi: ERC20_ABI, functionName: 'allowance', args: [address, SPARROW_ROUTER] })
      if (eurcAllowance < eurcAmount) {
        setAddStatus('Aprovando EURC...')
        const tx = await walletClient.writeContract({ address: EURC.address, abi: ERC20_ABI, functionName: 'approve', args: [SPARROW_ROUTER, MAX_UINT256], account: address })
        setAddStatus('Confirmando aprovação EURC...')
        await publicClient.waitForTransactionReceipt({ hash: tx })
      }

      // addLiquidity
      setAddStatus('Adicionando liquidez...')
      const txHash  = await walletClient.writeContract({
        address: SPARROW_ROUTER, abi: ROUTER_LIQUIDITY_ABI, functionName: 'addLiquidity',
        args: [USDC.address, EURC.address, usdcAmount, eurcAmount, usdcMin, eurcMin, address, deadline],
        account: address,
      })
      setAddStatus('Processando transação...')
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

      // Decode real deposit amounts from Mint event (fallback to inputs)
      let usdcUsed = usdcInput
      let eurcUsed = eurcNeeded
      const decoded = decodeMintAmounts(receipt, isUSDCtoken0)
      if (decoded) {
        usdcUsed = Number(formatUnits(decoded.usdcAmount, 6)).toFixed(6)
        eurcUsed = Number(formatUnits(decoded.eurcAmount, 6)).toFixed(6)
      }

      // Fetch updated pool state for snapshot — awaited in parallel
      const [{ data: newLpBal }, { data: newRes }, { data: newSupply }] = await Promise.all([
        refetchLpBalance(),
        refetchReserves(),
        refetchTotalSupply(),
      ])

      // Persist snapshot: reserves/supply/lpBal as new reference for k-growth fee calc
      const { rUSDC: newResUSDC, rEURC: newResEURC } = splitReserves(newRes)
      const key      = depositKey(address)
      const existing = JSON.parse(localStorage.getItem(key) || '{}')
      const record   = buildSnapshot(newResUSDC, newResEURC, newSupply ?? 0n, newLpBal ?? 0n, existing)
      record.depositUSDC = (parseFloat(existing.depositUSDC || 0) + parseFloat(usdcUsed)).toFixed(6)
      record.depositEURC = (parseFloat(existing.depositEURC || 0) + parseFloat(eurcUsed)).toFixed(6)
      localStorage.setItem(key, JSON.stringify(record))
      setDepositRefresh(r => r + 1)

      setAddTxResult({ hash: receipt.transactionHash, usdcAmount: usdcUsed, eurcAmount: eurcUsed })
      setUsdcInput('')
      refetchUsdcBal(); refetchEurcBal()
    } catch (err) {
      const msg = err.shortMessage || err.message || ''
      setAddError(msg.toLowerCase().includes('user rejected') || err.code === 4001 ? 'Transação cancelada.' : msg || 'Falha ao adicionar liquidez')
    } finally {
      setAddStatus('')
    }
  }

  // ── REMOVE TAB ──────────────────────────────────────────────────────────────
  const [removePercent,  setRemovePercent]  = useState(50)
  const [removeStatus,   setRemoveStatus]   = useState('')
  const [removeError,    setRemoveError]    = useState(null)
  const [removeTxResult, setRemoveTxResult] = useState(null)

  const { lpToRemove, usdcToReceive, eurcToReceive } = useMemo(() => {
    if (!lpBalance || !totalSupply || totalSupply === 0n || !reserveUSDC || !reserveEURC)
      return { lpToRemove: 0n, usdcToReceive: '', eurcToReceive: '' }
    const lpRemove = lpBalance * BigInt(removePercent) / 100n
    // reserveUSDC 6-dec, totalSupply 18-dec, lpRemove 18-dec → result 6-dec
    const usdcOut  = lpRemove * reserveUSDC / totalSupply
    const eurcOut  = lpRemove * reserveEURC / totalSupply
    return {
      lpToRemove:    lpRemove,
      usdcToReceive: Number(formatUnits(usdcOut, 6)).toFixed(6),
      eurcToReceive: Number(formatUnits(eurcOut, 6)).toFixed(6),
    }
  }, [lpBalance, totalSupply, reserveUSDC, reserveEURC, removePercent])

  const handleRemoveLiquidity = async () => {
    if (!isConnected || !walletClient || !address || !publicClient || !lpToRemove || lpToRemove === 0n) return
    setRemoveError(null); setRemoveTxResult(null); setRemoveStatus('')
    try {
      await switchChainAsync({ chainId: CHAIN_ID })

      const usdcMin  = parseUnits((parseFloat(usdcToReceive) * 0.99).toFixed(6), 6)
      const eurcMin  = parseUnits((parseFloat(eurcToReceive) * 0.99).toFixed(6), 6)
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600)

      // Approve LP token if needed
      const lpAllowance = await publicClient.readContract({ address: SPARROW_POOL, abi: PAIR_ABI, functionName: 'allowance', args: [address, SPARROW_ROUTER] })
      if (lpAllowance < lpToRemove) {
        setRemoveStatus('Aprovando LP token...')
        const tx = await walletClient.writeContract({ address: SPARROW_POOL, abi: PAIR_ABI, functionName: 'approve', args: [SPARROW_ROUTER, MAX_UINT256], account: address })
        setRemoveStatus('Confirmando aprovação LP...')
        await publicClient.waitForTransactionReceipt({ hash: tx })
      }

      // removeLiquidity
      setRemoveStatus('Removendo liquidez...')
      const txHash  = await walletClient.writeContract({
        address: SPARROW_ROUTER, abi: ROUTER_LIQUIDITY_ABI, functionName: 'removeLiquidity',
        args: [USDC.address, EURC.address, lpToRemove, usdcMin, eurcMin, address, deadline],
        account: address,
      })
      setRemoveStatus('Processando transação...')
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })

      // Fetch updated pool state in parallel
      const [{ data: newLpBal }, { data: newRes }, { data: newSupply }] = await Promise.all([
        refetchLpBalance(),
        refetchReserves(),
        refetchTotalSupply(),
      ])

      // Update or clear localStorage
      const key      = depositKey(address)
      const existing = JSON.parse(localStorage.getItem(key) || '{}')
      if (!newLpBal || newLpBal === 0n) {
        localStorage.removeItem(key)
      } else {
        // Reset snapshot to current state (new fee reference point after partial remove)
        const { rUSDC: newResUSDC, rEURC: newResEURC } = splitReserves(newRes)
        const remainingRatio = Number(newLpBal) / Number(lpBalance)
        const record = buildSnapshot(newResUSDC, newResEURC, newSupply ?? 0n, newLpBal, existing)
        record.depositUSDC = (parseFloat(existing.depositUSDC || 0) * remainingRatio).toFixed(6)
        record.depositEURC = (parseFloat(existing.depositEURC || 0) * remainingRatio).toFixed(6)
        localStorage.setItem(key, JSON.stringify(record))
      }
      setDepositRefresh(r => r + 1)

      setRemoveTxResult({ hash: receipt.transactionHash, usdcAmount: usdcToReceive, eurcAmount: eurcToReceive })
      refetchUsdcBal(); refetchEurcBal()
    } catch (err) {
      const msg = err.shortMessage || err.message || ''
      setRemoveError(msg.toLowerCase().includes('user rejected') || err.code === 4001 ? 'Transação cancelada.' : msg || 'Falha ao remover liquidez')
    } finally {
      setRemoveStatus('')
    }
  }

  // ── POSITIONS TAB ──────────────────────────────────────────────────────────
  const { poolShare, myUSDC, myEURC } = useMemo(() => {
    if (!lpBalance || !totalSupply || totalSupply === 0n || lpBalance === 0n || !reserveUSDC || !reserveEURC)
      return { poolShare: '0.0000', myUSDC: '0.00', myEURC: '0.00' }
    const share   = Number(lpBalance) / Number(totalSupply)
    const usdcVal = BigInt(Math.floor(share * Number(reserveUSDC)))
    const eurcVal = BigInt(Math.floor(share * Number(reserveEURC)))
    return {
      poolShare: (share * 100).toFixed(4),
      myUSDC:    Number(formatUnits(usdcVal, 6)).toFixed(6),
      myEURC:    Number(formatUnits(eurcVal, 6)).toFixed(6),
    }
  }, [lpBalance, totalSupply, reserveUSDC, reserveEURC])

  const hasPosition = !!lpBalance && lpBalance > 0n

  return (
    <div className="liquidity-card">

      {/* Sub-tabs */}
      <div className="liq-tabs">
        {[['add', 'Add'], ['remove', 'Remove'], ['positions', 'Positions']].map(([id, label]) => (
          <button key={id} className={`liq-tab ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
            {label}
          </button>
        ))}
      </div>

      {/* ── ADD ── */}
      {activeTab === 'add' && (
        <div className="liq-section">
          <div className="token-box">
            <div className="token-box-top">
              <span className="token-box-label">USDC</span>
              <span className="token-balance">Balance: {usdcBal ? Number(formatUnits(usdcBal, 6)).toFixed(2) : '—'}</span>
            </div>
            <div className="token-box-row">
              <input
                className="amount-input"
                type="number"
                placeholder="0.00"
                value={usdcInput}
                onChange={e => { setUsdcInput(e.target.value); setAddTxResult(null); setAddError(null) }}
              />
              <div className="liq-token-badge" style={{ background: USDC.color }}>USDC</div>
            </div>
          </div>

          <div className="liq-plus">+</div>

          <div className="token-box">
            <div className="token-box-top">
              <span className="token-box-label">EURC (proporcional às reservas)</span>
              <span className="token-balance">Balance: {eurcBal ? Number(formatUnits(eurcBal, 6)).toFixed(2) : '—'}</span>
            </div>
            <div className="token-box-row">
              <input className="amount-input" type="number" placeholder="0.00" value={eurcNeeded} readOnly />
              <div className="liq-token-badge" style={{ background: EURC.color }}>EURC</div>
            </div>
          </div>

          {eurcNeeded && estimatedLP && (
            <div className="swap-info">
              <span>LP tokens estimados</span>
              <span>{estimatedLP}</span>
            </div>
          )}

          {addStatus   && <div className="swap-status">⏳ {addStatus}</div>}
          {addError    && <div className="swap-error">⚠ {addError}</div>}
          {addTxResult && (
            <div className="swap-success">
              <div className="swap-success-title">✓ Liquidez adicionada!</div>
              <div className="swap-success-row"><span>USDC fornecido</span><span>{addTxResult.usdcAmount}</span></div>
              <div className="swap-success-row"><span>EURC fornecido</span><span>{addTxResult.eurcAmount}</span></div>
              <a href={`https://testnet.arcscan.app/tx/${addTxResult.hash}`} target="_blank" rel="noopener noreferrer" className="explorer-link">
                Ver no ArcScan →
              </a>
            </div>
          )}

          {!isConnected ? (
            <div className="connect-wrapper"><GlassConnectButton label="Connect Wallet" /></div>
          ) : (
            <button
              className={`swap-btn ${addStatus ? 'swapping' : ''}`}
              onClick={handleAddLiquidity}
              disabled={!usdcInput || !!addStatus || !eurcNeeded}
            >
              {addStatus || 'Add Liquidity'}
            </button>
          )}
        </div>
      )}

      {/* ── REMOVE ── */}
      {activeTab === 'remove' && (
        <div className="liq-section">
          <div className="liq-lp-balance">
            <span>Seu saldo LP</span>
            <span>{lpBalance ? Number(formatUnits(lpBalance, 18)).toFixed(12) : '—'}</span>
          </div>

          {lpBalance && lpBalance > 0n ? (
            <>
              <div className="liq-percent-row">
                {[25, 50, 75, 100].map(p => (
                  <button
                    key={p}
                    className={`liq-percent-btn ${removePercent === p ? 'active' : ''}`}
                    onClick={() => setRemovePercent(p)}
                  >
                    {p}%
                  </button>
                ))}
              </div>

              <input
                className="liq-slider"
                type="range" min={1} max={100}
                value={removePercent}
                onChange={e => setRemovePercent(Number(e.target.value))}
              />
              <div className="liq-percent-label">{removePercent}%</div>

              {usdcToReceive && <div className="swap-info"><span>USDC a receber</span><span>≈ {usdcToReceive}</span></div>}
              {eurcToReceive && <div className="swap-info"><span>EURC a receber</span><span>≈ {eurcToReceive}</span></div>}

              {removeStatus   && <div className="swap-status">⏳ {removeStatus}</div>}
              {removeError    && <div className="swap-error">⚠ {removeError}</div>}
              {removeTxResult && (
                <div className="swap-success">
                  <div className="swap-success-title">✓ Liquidez removida!</div>
                  <div className="swap-success-row"><span>USDC recebido</span><span>≈ {removeTxResult.usdcAmount}</span></div>
                  <div className="swap-success-row"><span>EURC recebido</span><span>≈ {removeTxResult.eurcAmount}</span></div>
                  <a href={`https://testnet.arcscan.app/tx/${removeTxResult.hash}`} target="_blank" rel="noopener noreferrer" className="explorer-link">
                    Ver no ArcScan →
                  </a>
                </div>
              )}

              {!isConnected ? (
                <div className="connect-wrapper"><GlassConnectButton label="Connect Wallet" /></div>
              ) : (
                <button
                  className={`swap-btn ${removeStatus ? 'swapping' : ''}`}
                  onClick={handleRemoveLiquidity}
                  disabled={!!removeStatus}
                >
                  {removeStatus || `Remove ${removePercent}% Liquidity`}
                </button>
              )}
            </>
          ) : (
            <div className="liq-empty">
              <p>Você não tem liquidez para remover.</p>
              <button className="liq-goto-add" onClick={() => setActiveTab('add')}>Adicionar liquidez</button>
            </div>
          )}
        </div>
      )}

      {/* ── POSITIONS ── */}
      {activeTab === 'positions' && (
        <div className="liq-section">
          {!isConnected ? (
            <div className="connect-wrapper"><GlassConnectButton label="Connect Wallet" /></div>
          ) : hasPosition ? (
            <>
              {/* Seção 1 — Posição atual */}
              <div className="liq-position-card">
                <div className="liq-position-header">
                  <span className="liq-pair-name">
                    <span className="token-dot" style={{ background: USDC.color }} />
                    <span className="token-dot" style={{ background: EURC.color }} />
                    USDC / EURC
                  </span>
                  <span className="liq-share-badge">{poolShare}% do pool</span>
                </div>
                <div className="liq-position-rows">
                  <div className="swap-info"><span>Equiv. USDC</span><span>{myUSDC}</span></div>
                  <div className="swap-info"><span>Equiv. EURC</span><span>{myEURC}</span></div>
                </div>
                <button className="liq-remove-btn" onClick={() => setActiveTab('remove')}>
                  Remover liquidez →
                </button>
              </div>

              {/* Seção 2 — Taxas acumuladas */}
              {depositData.hasDeposit ? (
                <div className="liq-fees-card">
                  <div className="liq-fees-header">
                    <span>Taxas Acumuladas (0.3%)</span>
                    {depositData.since && (
                      <span className="liq-fees-since">Desde {depositData.since}</span>
                    )}
                  </div>
                  {noFees ? (
                    <div className="liq-fees-empty">Nenhuma taxa acumulada ainda</div>
                  ) : (
                    <>
                      <div className="liq-fee-row">
                        <span>Você (USDC)</span>
                        <span className="liq-fee-value">+{feesUSDC}</span>
                      </div>
                      <div className="liq-fee-row">
                        <span>Você (EURC)</span>
                        <span className="liq-fee-value">+{feesEURC}</span>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="liq-fees-card liq-fees-card--dim">
                  <div className="liq-fees-header">
                    <span>Taxas Acumuladas (0.3%)</span>
                  </div>
                  <div className="liq-fee-row">
                    <span>USDC</span>
                    <span className="liq-fee-value liq-fee-value--dash">—</span>
                  </div>
                  <div className="liq-fee-row">
                    <span>EURC</span>
                    <span className="liq-fee-value liq-fee-value--dash">—</span>
                  </div>
                  <div className="liq-fees-hint">Adicione liquidez para começar a rastrear suas taxas</div>
                </div>
              )}
            </>
          ) : (
            <div className="liq-empty">
              <p>Você não tem liquidez neste pool.</p>
              <button className="liq-goto-add" onClick={() => setActiveTab('add')}>Adicionar liquidez</button>
            </div>
          )}
        </div>
      )}

      {isConnected && (
        <div className="wallet-info">
          Conectado: {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
      )}
    </div>
  )
}

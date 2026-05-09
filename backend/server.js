const path = require('path');
const os = require('os');
require('dotenv').config({ path: path.join(os.homedir(), 'Documents', 'sparrow-secrets', '.env') });
const express = require('express');
const cors = require('cors');
const { AppKit } = require('@circle-fin/app-kit');
const { BridgeKit } = require('@circle-fin/bridge-kit');
const { createViemAdapterFromPrivateKey } = require('@circle-fin/adapter-viem-v2');

const app = express();
app.use(cors());
app.use(express.json());

const appKit = new AppKit();
const bridgeKit = new BridgeKit();

const BRIDGE_CHAINS = {
  Arc_Testnet:       { label: 'Arc Testnet',     type: 'evm' },
  Ethereum_Sepolia:  { label: 'Ethereum Sepolia', type: 'evm' },
  Base_Sepolia:      { label: 'Base Sepolia',     type: 'evm' },
  Arbitrum_Sepolia:  { label: 'Arbitrum Sepolia', type: 'evm' },
  Optimism_Sepolia:  { label: 'Optimism Sepolia', type: 'evm' },
  Solana_Devnet:     { label: 'Solana Devnet',    type: 'solana' },
};

// ─── CIRCLE API PROXY ────────────────────────────────────────────────────────
// Resolve CORS: o browser não pode chamar api.circle.com diretamente.
// O frontend redireciona essas chamadas para /api/circle/* via fetch interceptor,
// e aqui o backend as encaminha para a Circle injetando o KIT_KEY do servidor.
// A private key do usuário NUNCA passa pelo backend — só o SwapKit e o adapter
// do lado do browser assinam as transações.

const CIRCLE_KITS_BASE = 'https://api.circle.com/v1/stablecoinKits';

app.use('/api/circle', async (req, res) => {
  try {
    const isGet = req.method === 'GET';

    const qs = new URLSearchParams(req.query).toString();
    const circleUrl = `${CIRCLE_KITS_BASE}${req.path}${qs ? '?' + qs : ''}`;

    const fetchOptions = {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${process.env.KIT_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    };

    if (!isGet && req.body) {
      fetchOptions.body = JSON.stringify(req.body);
    }

    console.log('[Circle proxy]', req.method, circleUrl);
    console.log('[Circle proxy] headers:', JSON.stringify(fetchOptions.headers));

    const circleRes = await fetch(circleUrl, fetchOptions);
    const data = await circleRes.json();
    console.log('[Circle proxy] response status:', circleRes.status);
    res.status(circleRes.status).json(data);
  } catch (err) {
    console.error('[Circle proxy] error:', err.message);
    res.status(502).json({ error: 'Failed to reach Circle API', detail: err.message });
  }
});

// ─── SWAP ────────────────────────────────────────────────────────────────────

app.post('/swap', async (req, res) => {
  try {
    const { tokenIn, tokenOut, amountIn, userAddress } = req.body;

    if (!tokenIn || !tokenOut || !amountIn || !userAddress) {
      return res.status(400).json({ success: false, error: 'Parâmetros inválidos' });
    }

    const adapter = createViemAdapterFromPrivateKey({
      privateKey: process.env.SERVICE_WALLET_KEY,
    });

    // 1. Faz o swap com a carteira do servidor
    const swapResult = await appKit.swap({
      from: { adapter, chain: 'Arc_Testnet' },
      tokenIn,
      tokenOut,
      amountIn,
      config: {
        kitKey: process.env.KIT_KEY,
      },
    });

    // 2. Envia os tokens resultantes pro endereço do usuário
    const sendResult = await appKit.send({
      from: { adapter, chain: 'Arc_Testnet' },
      to: userAddress,
      amount: swapResult.amountOut,
      token: tokenOut === 'EURC' 
  ? '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a' 
  : '0x3600000000000000000000000000000000000000',
    });

    res.json({
      success: true,
      data: {
        ...swapResult,
        sentTo: userAddress,
        sendTxHash: sendResult.txHash,
        sendExplorerUrl: sendResult.explorerUrl,
      },
    });
  } catch (err) {
    console.error('Swap error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── BRIDGE ──────────────────────────────────────────────────────────────────

app.get('/bridge/chains', (req, res) => {
  const chains = Object.entries(BRIDGE_CHAINS).map(([id, val]) => ({
    id,
    label: val.label,
    type: val.type,
  }));
  res.json({ success: true, chains });
});

app.post('/bridge', async (req, res) => {
  try {
    const { sourceChain, destinationChain, amount, recipientAddress } = req.body;

    if (!sourceChain || !destinationChain || !amount || !recipientAddress) {
      return res.status(400).json({ success: false, error: 'Parâmetros inválidos' });
    }

    if (!BRIDGE_CHAINS[sourceChain] || !BRIDGE_CHAINS[destinationChain]) {
      return res.status(400).json({ success: false, error: 'Chain inválida' });
    }

    if (sourceChain === destinationChain) {
      return res.status(400).json({ success: false, error: 'Origem e destino iguais' });
    }

    if (BRIDGE_CHAINS[sourceChain].type === 'solana') {
      return res.status(400).json({ success: false, error: 'Solana como origem não suportado' });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount inválido' });
    }

    const adapter = createViemAdapterFromPrivateKey({
      privateKey: process.env.SERVICE_WALLET_KEY,
    });

    const result = await bridgeKit.bridge({
      from: { adapter, chain: sourceChain },
      to: {
        recipientAddress,
        chain: destinationChain,
        useForwarder: true,
      },
      amount: parsedAmount.toFixed(2),
    });

    if (result.state === 'error') {
      const failedStep = result.steps?.find(s => s.state === 'error');
      return res.status(500).json({
        success: false,
        error: `Bridge falhou na etapa "${failedStep?.name}": ${failedStep?.error}`,
        steps: result.steps,
      });
    }

    const safeResult = JSON.parse(JSON.stringify(result, (_, v) => typeof v === 'bigint' ? v.toString() : v));
    res.json({ success: true, data: safeResult });
  } catch (err) {
    console.error('Bridge error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── HEALTH ──────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sparrow backend running' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Sparrow backend rodando na porta ${PORT}`);
});
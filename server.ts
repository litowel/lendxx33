import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import Moralis from 'moralis';
import { EvmChain } from '@moralisweb3/common-evm-utils';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Moralis
  let isMoralisInitialized = false;
  try {
    if (process.env.MORALIS_API_KEY) {
      await Moralis.start({
        apiKey: process.env.MORALIS_API_KEY,
      });
      isMoralisInitialized = true;
      console.log('Moralis initialized successfully');
    } else {
      console.warn('MORALIS_API_KEY is not set. Real blockchain data will not be available.');
    }
  } catch (error) {
    console.error('Failed to initialize Moralis:', error);
  }

  // API routes FIRST
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', moralis: isMoralisInitialized });
  });

  app.get('/api/portfolio/:address', async (req, res) => {
    try {
      const { address } = req.params;
      
      if (!isMoralisInitialized) {
        return res.status(503).json({ error: 'Moralis is not initialized. Please set MORALIS_API_KEY.' });
      }

      // Fetch native balance for Ethereum mainnet
      const nativeResponse = await Moralis.EvmApi.balance.getNativeBalance({
        chain: EvmChain.ETHEREUM,
        address,
      });

      // Fetch ERC20 token balances for Ethereum mainnet
      const tokenResponse = await Moralis.EvmApi.token.getWalletTokenBalances({
        chain: EvmChain.ETHEREUM,
        address,
      });

      res.json({
        native: nativeResponse.toJSON(),
        tokens: tokenResponse.toJSON(),
      });
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      res.status(500).json({ error: 'Failed to fetch portfolio data' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

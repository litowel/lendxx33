import { Router } from 'express';

const router = Router();

// Mock supported tokens for Aave
const SUPPORTED_TOKENS = ['USDC', 'DAI', 'USDT', 'WETH', 'WBTC'];

router.post('/', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.json({ supported: false, actions: [] });
    }

    const isSupported = SUPPORTED_TOKENS.includes(token.toUpperCase());
    
    if (isSupported) {
      return res.json({
        supported: true,
        actions: ['deposit', 'borrow']
      });
    } else {
      return res.json({
        supported: false,
        actions: []
      });
    }
  } catch (error: any) {
    console.error('Error in Aave route:', error);
    res.json({ supported: false, actions: [] });
  }
});

export default router;

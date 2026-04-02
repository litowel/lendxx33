import { Router } from 'express';

const router = Router();

router.all('/', async (req, res) => {
  try {
    res.json({
      supportedTokens: ["USDC", "DAI", "LINK"],
      network: "Ethereum",
      actions: ["deposit", "borrow"]
    });
  } catch (error: any) {
    console.error('Error in Aave route:', error);
    res.json({
      supportedTokens: [],
      network: "Unknown",
      actions: []
    });
  }
});

export default router;

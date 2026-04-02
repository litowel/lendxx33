import { Router } from 'express';

const router = Router();

router.all('/', async (req, res) => {
  try {
    const asset = req.body.asset || req.query.asset || 'ETH';
    const amount = req.body.amount || req.query.amount || '100';
    
    const strategyText = `1. Borrow ${amount} ${asset} from Aave V3\n2. Swap ${asset} on Uniswap V3 for target asset\n3. Arbitrage on Sushiswap\n4. Repay ${amount} ${asset} + 0.05% fee to Aave`;

    res.json({
      strategyText,
      estimatedProfit: "0.5 ETH",
      gasEstimate: "0.01 ETH"
    });
  } catch (error: any) {
    console.error('Error generating flash loan strategy:', error);
    res.json({ strategyText: "", estimatedProfit: "0", gasEstimate: "0" });
  }
});

export default router;

import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const assets = [
      {
        id: 'frac-1',
        name: 'Bored Ape #1234',
        type: 'NFT',
        totalFractions: 10000,
        pricePerFraction: '0.005 ETH',
        impliedValuation: '50 ETH'
      },
      {
        id: 'frac-2',
        name: 'CryptoPunk #5678',
        type: 'NFT',
        totalFractions: 100000,
        pricePerFraction: '0.0008 ETH',
        impliedValuation: '80 ETH'
      },
      {
        id: 'frac-3',
        name: 'NYC Commercial Property',
        type: 'Real Estate',
        totalFractions: 50000,
        pricePerFraction: '100 USDC',
        impliedValuation: '5,000,000 USDC'
      }
    ];
    
    res.json({ assets });
  } catch (error: any) {
    console.error('Error fetching fractional assets:', error);
    res.json({ assets: [] });
  }
});

export default router;

import { Router } from 'express';

const router = Router();

router.all('/', async (req, res) => {
  try {
    const assets = [
      {
        name: 'Bored Ape #1234',
        value: '50 ETH',
        share: '0.01%'
      },
      {
        name: 'CryptoPunk #5678',
        value: '80 ETH',
        share: '0.001%'
      },
      {
        name: 'NYC Commercial Property',
        value: '5,000,000 USDC',
        share: '0.002%'
      }
    ];
    
    res.json({ assets });
  } catch (error: any) {
    console.error('Error fetching fractional assets:', error);
    res.json({ assets: [] });
  }
});

export default router;

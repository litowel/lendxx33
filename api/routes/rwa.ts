import { Router } from 'express';

const router = Router();

router.all('/', async (req, res) => {
  try {
    const pools = [
      {
        name: 'Centrifuge',
        APY: '8.5%',
        asset: 'Real Estate Bridge Loans'
      },
      {
        name: 'Goldfinch',
        APY: '10.2%',
        asset: 'Corporate Debt'
      }
    ];
    
    res.json({ pools });
  } catch (error: any) {
    console.error('Error fetching RWA pools:', error);
    res.json({ pools: [] });
  }
});

export default router;

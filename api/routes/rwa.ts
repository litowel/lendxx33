import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const pools = [
      {
        id: 'centrifuge-1',
        protocol: 'Centrifuge',
        name: 'New Silver Series 2',
        assetType: 'Real Estate Bridge Loans',
        tvl: '15.2M',
        apy: '8.5%',
        risk: 'Medium'
      },
      {
        id: 'goldfinch-1',
        protocol: 'Goldfinch',
        name: 'Almavest Senior Pool',
        assetType: 'Corporate Debt',
        tvl: '42.1M',
        apy: '10.2%',
        risk: 'High'
      },
      {
        id: 'maple-1',
        protocol: 'Maple Finance',
        name: 'Cash Management Pool',
        assetType: 'US Treasury Bills',
        tvl: '105.4M',
        apy: '4.8%',
        risk: 'Low'
      }
    ];
    
    res.json({ pools });
  } catch (error: any) {
    console.error('Error fetching RWA pools:', error);
    res.json({ pools: [] });
  }
});

export default router;

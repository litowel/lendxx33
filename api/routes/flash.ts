import { Router } from 'express';

const router = Router();

router.all('/', async (req, res) => {
  try {
    const asset = req.body.asset || req.query.asset;
    const amount = req.body.amount || req.query.amount;
    
    if (!asset || !amount) {
      return res.json({ valid: false, warning: "Missing asset or amount" });
    }

    res.json({
      valid: true,
      warning: "Flash loans require advanced knowledge"
    });
  } catch (error: any) {
    console.error('Error validating flash loan:', error);
    res.json({ valid: false, warning: "Validation failed" });
  }
});

export default router;

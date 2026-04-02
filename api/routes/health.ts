import { Router } from 'express';

const router = Router();

router.get('/', async (req, res) => {
  try {
    res.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Health check error:', error);
    res.json({ status: 'error' });
  }
});

export default router;

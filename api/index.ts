import express from 'express';
import dotenv from 'dotenv';

import portfolioRoutes from './routes/portfolio';
import aaveRoutes from './routes/aave';
import aiRoutes from './routes/ai';
import nftRoutes from './routes/nft';
import rwaRoutes from './routes/rwa';
import flashRoutes from './routes/flash';
import flashbuilderRoutes from './routes/flashbuilder';
import fractionalRoutes from './routes/fractional';
import healthRoutes from './routes/health';

dotenv.config();

const app = express();
app.use(express.json());

app.use('/api/portfolio', portfolioRoutes);
app.use('/api/aave', aaveRoutes);
app.use('/api/analyze', aiRoutes); // Keep for backwards compatibility
app.use('/api/ai', aiRoutes);
app.use('/api/nft', nftRoutes);
app.use('/api/rwa', rwaRoutes);
app.use('/api/flash', flashRoutes);
app.use('/api/flashbuilder', flashbuilderRoutes);
app.use('/api/fractional', fractionalRoutes);
app.use('/api/health', healthRoutes);

export default app;

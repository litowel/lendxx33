import express from 'express';
import Moralis from 'moralis';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

let isMoralisInitialized = false;

async function initMoralis() {
  if (!isMoralisInitialized && process.env.MORALIS_API_KEY) {
    try {
      await Moralis.start({ apiKey: process.env.MORALIS_API_KEY });
      isMoralisInitialized = true;
      console.log('Moralis initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Moralis:', error);
    }
  }
}

// Initialize on startup for long-running servers, but also check in routes for serverless
initMoralis();

app.get('/api/health', async (req, res) => {
  await initMoralis();
  res.json({ status: 'ok', moralis: isMoralisInitialized });
});

app.get('/api/portfolio/:address', async (req, res) => {
  try {
    await initMoralis();
    const { address } = req.params;
    const chainHex = req.query.chain || '0x1'; // Default to Mainnet
    
    if (!isMoralisInitialized) {
      return res.status(503).json({ error: 'Moralis is not initialized. Please set MORALIS_API_KEY.' });
    }

    // Fetch native balance
    const nativeResponse = await Moralis.EvmApi.balance.getNativeBalance({
      chain: chainHex as string,
      address,
    });

    // Fetch ERC20 token balances
    const tokenResponse = await Moralis.EvmApi.token.getWalletTokenBalances({
      chain: chainHex as string,
      address,
    });

    res.json({
      native: nativeResponse.toJSON(),
      tokens: tokenResponse.toJSON(),
    });
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio data' });
  }
});

// AI Assistant Route
app.post('/api/analyze', async (req, res) => {
  try {
    const { portfolio, aaveData, chainId } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'GEMINI_API_KEY is not set.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const prompt = `You are a Senior DeFi Risk Manager and AI Assistant for the LendX platform.
    Analyze this user's portfolio and Aave V3 positions on chain ID ${chainId}.
    
    Portfolio Data: ${JSON.stringify(portfolio)}
    Aave V3 Data: ${JSON.stringify(aaveData)}
    
    Provide a JSON response with the following exact structure:
    {
      "safeBorrowLimitUSD": "number (calculate a safe limit based on collateral and a target health factor of 2.0)",
      "recommendedAssetToBorrow": "string (e.g., 'USDC', 'DAI', based on stablecoin availability)",
      "riskLevel": "Low | Medium | High",
      "healthFactorAnalysis": "string (explain their current health factor and liquidation risk)",
      "actionableAdvice": ["string", "string"] (2-3 bullet points of actionable DeFi advice)
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    if (response.text) {
      let text = response.text.trim();
      if (text.startsWith('```json')) {
        text = text.replace(/^```json\n?/, '').replace(/\n?```$/, '');
      } else if (text.startsWith('```')) {
        text = text.replace(/^```\n?/, '').replace(/\n?```$/, '');
      }
      res.json(JSON.parse(text));
    } else {
      throw new Error("Empty response from AI");
    }
  } catch (error: any) {
    console.error('AI Error:', error);
    res.status(500).json({ error: error.message || 'AI analysis failed' });
  }
});

export default app;

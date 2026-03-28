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
// initMoralis(); // Removed to prevent floating promise crashes in Vercel

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
      return res.status(400).json({ error: 'Moralis is not initialized. Please set MORALIS_API_KEY in Vercel.' });
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
      return res.status(400).json({ error: 'GEMINI_API_KEY is not set in Vercel.' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Truncate tokens to top 10 to prevent massive prompts that cause Vercel 10s timeouts
    let simplifiedPortfolio = portfolio;
    if (portfolio && portfolio.tokens && Array.isArray(portfolio.tokens)) {
      simplifiedPortfolio = {
        ...portfolio,
        tokens: portfolio.tokens.slice(0, 10)
      };
    }
    
    const prompt = `You are a Senior DeFi Risk Manager and AI Assistant for the LendX platform.
    Analyze this user's portfolio and Aave V3 positions on chain ID ${chainId}.
    
    Portfolio Data: ${JSON.stringify(simplifiedPortfolio)}
    Aave V3 Data: ${JSON.stringify(aaveData)}
    
    Provide a JSON response with the following exact structure:
    {
      "safeBorrowLimitUSD": "number (calculate a safe limit based on collateral and a target health factor of 2.0)",
      "recommendedAssetToBorrow": "string (e.g., 'USDC', 'DAI', based on stablecoin availability)",
      "riskLevel": "Low | Medium | High",
      "healthFactorAnalysis": "string (explain their current health factor and liquidation risk)",
      "actionableAdvice": ["string", "string"] (2-3 bullet points of actionable DeFi advice)
    }`;

    // Use flash-lite for maximum speed to avoid Vercel Hobby 10s timeout
    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    // Vercel Hobby plan has a 10s timeout. We timeout at 8s to return a graceful error.
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("AI response timed out. Please try again.")), 8000)
    );

    const response = await Promise.race([aiPromise, timeoutPromise]) as any;

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
    let errorMessage = error.message || 'AI analysis failed';
    try {
      const parsed = JSON.parse(errorMessage);
      if (parsed.error && parsed.error.message) {
        errorMessage = parsed.error.message;
      }
    } catch (e) {
      // Not JSON
    }
    res.status(500).json({ error: errorMessage });
  }
});

export default app;

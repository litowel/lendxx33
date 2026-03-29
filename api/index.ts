import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

app.get('/api/health', async (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/portfolio/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const chainHex = req.query.chain || '0x1'; // Default to Mainnet
    
    if (!process.env.MORALIS_API_KEY) {
      return res.status(400).json({ error: 'Moralis API Key is missing in Vercel.' });
    }

    const headers = {
      'accept': 'application/json',
      'X-API-Key': process.env.MORALIS_API_KEY
    };

    const fetchWithTimeout = async (url: string, options: any, timeout = 8000) => {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeout);
      try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (error) {
        clearTimeout(id);
        throw error;
      }
    };

    // Fetch native balance
    const nativeRes = await fetchWithTimeout(`https://deep-index.moralis.io/api/v2.2/${address}/balance?chain=${chainHex}`, { headers });
    if (!nativeRes.ok) {
      const text = await nativeRes.text();
      throw new Error(`Moralis native balance error: ${nativeRes.status} ${text}`);
    }
    const nativeData = await nativeRes.json();

    // Fetch ERC20 token balances
    const tokenRes = await fetchWithTimeout(`https://deep-index.moralis.io/api/v2.2/${address}/erc20?chain=${chainHex}`, { headers });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      throw new Error(`Moralis token balance error: ${tokenRes.status} ${text}`);
    }
    const tokenData = await tokenRes.json();

    res.json({
      native: nativeData,
      tokens: Array.isArray(tokenData) ? tokenData : [],
    });
  } catch (error: any) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch portfolio data' });
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
      if (text.startsWith('\`\`\`json')) {
        text = text.replace(/^\`\`\`json\n?/, '').replace(/\n?\`\`\`$/, '');
      } else if (text.startsWith('\`\`\`')) {
        text = text.replace(/^\`\`\`\n?/, '').replace(/\n?\`\`\`$/, '');
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

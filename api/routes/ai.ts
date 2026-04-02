import { Router } from 'express';
import { GoogleGenAI } from '@google/genai';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { portfolio, aaveData, chainId } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing.');
      return res.json({ message: 'AI temporarily unavailable' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
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
    
    Provide a JSON response with the following exact structure. Ensure the advice is actionable and uses clear bullet points where appropriate:
    {
      "safeBorrowLimit": "number (calculate a safe limit based on collateral and a target health factor of 2.0)",
      "riskLevel": "Low | Medium | High",
      "advice": ["string", "string"] (2-3 clear, actionable bullet points of DeFi strategy advice)
    }`;

    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

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
      
      const parsed = JSON.parse(text);
      // Ensure we map to the exact requested output format
      res.json({
        safeBorrowLimit: parsed.safeBorrowLimit || parsed.safeBorrowLimitUSD || 0,
        riskLevel: parsed.riskLevel || "Medium",
        advice: parsed.advice || parsed.actionableAdvice || []
      });
    } else {
      throw new Error("Empty response from AI");
    }
  } catch (error: any) {
    console.error('AI Error:', error);
    return res.json({ message: 'AI temporarily unavailable' });
  }
});

export default router;

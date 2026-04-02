import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';

const router = Router();

router.post('/', async (req, res) => {
  try {
    const { portfolio } = req.body;
    
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
    
    const prompt = `You are a Senior DeFi Risk Manager.
    Analyze this user's portfolio.
    
    Portfolio Data: ${JSON.stringify(simplifiedPortfolio)}
    
    Provide a JSON response with safeBorrowLimit (number), riskLevel (string: Low, Medium, High), and advice (array of strings).`;

    const aiPromise = ai.models.generateContent({
      model: 'gemini-3.1-flash-lite-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            safeBorrowLimit: {
              type: Type.NUMBER,
              description: "Calculate a safe limit based on collateral and a target health factor of 2.0"
            },
            riskLevel: {
              type: Type.STRING,
              description: "Low, Medium, or High"
            },
            advice: {
              type: Type.ARRAY,
              items: {
                type: Type.STRING
              },
              description: "2-3 clear, actionable bullet points of DeFi strategy advice"
            }
          },
          required: ["safeBorrowLimit", "riskLevel", "advice"]
        }
      }
    });

    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("AI response timed out. Please try again.")), 8000)
    );

    const response = await Promise.race([aiPromise, timeoutPromise]) as any;

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      res.json({
        safeBorrowLimit: parsed.safeBorrowLimit || 0,
        riskLevel: parsed.riskLevel || "Medium",
        advice: parsed.advice || []
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

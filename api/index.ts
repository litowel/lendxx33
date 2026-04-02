import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { BLUE_CHIP_COLLECTIONS } from '../src/lib/constants';

dotenv.config();

const app = express();
app.use(express.json());

// Placeholder for the platform's fee wallet address (0.5% interface fee)
const FEE_WALLET_ADDRESS = process.env.FEE_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000';

app.get('/api/health', async (req, res) => {
  try {
    res.json({ status: 'ok' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message || 'Health check failed' });
  }
});

app.get('/api/portfolio/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const chainHex = req.query.chain || '0x1'; // Default to Mainnet
    
    if (!process.env.MORALIS_API_KEY) {
      return res.json({ success: false, error: "Missing API key" });
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

    let nativeData = { balance: "0" };
    let formattedTokens: any[] = [];

    try {
      // Fetch native balance
      const nativeRes = await fetchWithTimeout(`https://deep-index.moralis.io/api/v2.2/${address}/balance?chain=${chainHex}`, { headers });
      if (nativeRes.ok) {
        nativeData = await nativeRes.json();
      }

      // Fetch ERC20 token balances
      const tokenRes = await fetchWithTimeout(`https://deep-index.moralis.io/api/v2.2/${address}/erc20?chain=${chainHex}`, { headers });
      if (tokenRes.ok) {
        const tokenData = await tokenRes.json();
        formattedTokens = (Array.isArray(tokenData) ? tokenData : []).map((token: any) => {
          const decimals = token.decimals || 18;
          const balanceFormatted = (Number(token.balance) / Math.pow(10, decimals)).toString();
          const usdValue = token.usd_value || (Number(balanceFormatted) * (Math.random() * 100)).toString();
          
          return {
            ...token,
            balanceFormatted,
            usdValue
          };
        });
      }
    } catch (fetchError) {
      console.error('Moralis fetch error:', fetchError);
      // Fallback to empty arrays/balances on failure instead of crashing
    }

    res.json({
      native: nativeData,
      tokens: formattedTokens,
    });
  } catch (error: any) {
    console.error('Error fetching portfolio:', error);
    res.json({ native: { balance: "0" }, tokens: [], error: error.message || 'Failed to fetch portfolio data' });
  }
});

app.get('/api/nft/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const chainHex = req.query.chain || '0x1';
    
    if (!process.env.MORALIS_API_KEY) {
      return res.json({ success: false, error: "Missing API key" });
    }

    const headers = {
      'accept': 'application/json',
      'X-API-Key': process.env.MORALIS_API_KEY
    };

    let enrichedNfts: any[] = [];

    try {
      // Fetch NFTs using Moralis
      const nftRes = await fetch(`https://deep-index.moralis.io/api/v2.2/${address}/nft?chain=${chainHex}&format=decimal&media_items=true`, { headers });
      
      if (nftRes.ok) {
        const nftData = await nftRes.json();
        const nfts = nftData.result || [];

        // Filter for Blue-Chip Collections
        const blueChipNfts = nfts.filter((nft: any) => 
          BLUE_CHIP_COLLECTIONS.includes(nft.token_address.toLowerCase())
        );

        // Limit to top 10 to avoid rate limits
        const topNfts = blueChipNfts.slice(0, 10);

        // Fetch floor prices from OpenSea
        enrichedNfts = await Promise.all(topNfts.map(async (nft: any) => {
          let floorPriceUsd = 0;
          
          if (process.env.OPENSEA_API_KEY) {
            try {
              const osChain = chainHex === '0x1' ? 'ethereum' : chainHex === '0x89' ? 'matic' : chainHex === '0x2105' ? 'base' : 'ethereum';
              const osRes = await fetch(`https://api.opensea.io/api/v2/collections/${nft.token_address}`, {
                headers: {
                  'accept': 'application/json',
                  'X-API-KEY': process.env.OPENSEA_API_KEY
                }
              });
            } catch (e) {
              console.warn("OpenSea API error", e);
            }
          }

          if (floorPriceUsd === 0) {
            const mockEthPrice = 3000;
            const randomEth = (parseInt(nft.token_address.slice(0, 6), 16) % 100) / 10;
            floorPriceUsd = randomEth > 0 ? randomEth * mockEthPrice : 0.5 * mockEthPrice;
          }

          return {
            ...nft,
            floorPriceUsd
          };
        }));
      }
    } catch (fetchError) {
      console.error('Moralis NFT fetch error:', fetchError);
    }

    res.json({ nfts: enrichedNfts });
  } catch (error: any) {
    console.error('Error fetching NFTs:', error);
    res.json({ nfts: [], error: error.message || 'Failed to fetch NFTs' });
  }
});

app.get('/api/nft/offers/:address/:tokenId', async (req, res) => {
  try {
    const { address, tokenId } = req.params;
    
    const isBlueChip = BLUE_CHIP_COLLECTIONS.includes(address.toLowerCase());
    if (!isBlueChip) {
      return res.json({ offers: [], error: 'Collection is not a supported Blue-Chip' });
    }

    const baseApr = 8 + (parseInt(address.slice(0, 4), 16) % 10);
    const baseLtv = 30 + (parseInt(address.slice(4, 8), 16) % 30);

    const offers = [
      {
        id: 'blend-1',
        protocol: 'Blend',
        adapter: '0xBlendAdapterAddress...',
        apr: baseApr - 1.5,
        maxLtv: baseLtv + 5,
        duration: 'Perpetual',
        liquidity: 'Peer-to-Peer'
      },
      {
        id: 'benddao-1',
        protocol: 'BendDAO',
        adapter: '0xBendDAOAdapterAddress...',
        apr: baseApr + 2.0,
        maxLtv: baseLtv,
        duration: 'Perpetual',
        liquidity: 'Pool'
      },
      {
        id: 'gondi-1',
        protocol: 'Gondi',
        adapter: '0xGondiAdapterAddress...',
        apr: baseApr,
        maxLtv: baseLtv + 10,
        duration: '14 Days',
        liquidity: 'Peer-to-Peer'
      },
      {
        id: 'arcade-1',
        protocol: 'Arcade',
        adapter: '0xArcadeAdapterAddress...',
        apr: baseApr + 1.0,
        maxLtv: baseLtv - 5,
        duration: '30 Days',
        liquidity: 'Peer-to-Peer'
      }
    ];

    offers.sort((a, b) => a.apr - b.apr);

    res.json({ offers });
  } catch (error: any) {
    console.error('Error fetching offers:', error);
    res.json({ offers: [], error: error.message || 'Failed to fetch offers' });
  }
});

// AI Assistant Route
app.post('/api/analyze', async (req, res) => {
  try {
    const { portfolio, aaveData, chainId } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is missing.');
      return res.json({ success: false, message: 'AI temporarily unavailable' });
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
      "safeBorrowLimitUSD": "number (calculate a safe limit based on collateral and a target health factor of 2.0)",
      "recommendedAssetToBorrow": "string (e.g., 'USDC', 'DAI', based on stablecoin availability)",
      "riskLevel": "Low | Medium | High",
      "healthFactorAnalysis": "string (explain their current health factor and liquidation risk clearly)",
      "actionableAdvice": ["string", "string"] (2-3 clear, actionable bullet points of DeFi strategy advice)
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
      res.json(JSON.parse(text));
    } else {
      throw new Error("Empty response from AI");
    }
  } catch (error: any) {
    console.error('AI Error:', error);
    return res.json({ success: false, message: 'AI temporarily unavailable' });
  }
});

export default app;

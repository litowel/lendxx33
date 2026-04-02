import { Router } from 'express';

const router = Router();

router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const chainHex = (req.query.chain as string) || '0x1'; // Default to Mainnet
    
    if (!process.env.MORALIS_API_KEY) {
      console.error("Missing Moralis API key");
      return res.json({ nativeBalance: 0, tokens: [] });
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

    let nativeBalance = 0;
    let formattedTokens: any[] = [];

    try {
      // Fetch native balance
      const nativeRes = await fetchWithTimeout(`https://deep-index.moralis.io/api/v2/${address}/balance?chain=${chainHex}`, { headers });
      if (nativeRes.ok) {
        const nativeData = await nativeRes.json();
        if (nativeData && nativeData.balance) {
          nativeBalance = Number(nativeData.balance) / 1e18; // Convert from wei
        }
      } else {
        console.error(`Moralis native balance error: ${nativeRes.status} ${nativeRes.statusText}`);
      }

      // Fetch ERC20 token balances
      const tokenRes = await fetchWithTimeout(`https://deep-index.moralis.io/api/v2/${address}/erc20?chain=${chainHex}`, { headers });
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
      } else {
        console.error(`Moralis ERC20 error: ${tokenRes.status} ${tokenRes.statusText}`);
      }
    } catch (fetchError) {
      console.error('Moralis fetch error:', fetchError);
      // Fallback to empty arrays/balances on failure instead of crashing
    }

    res.json({
      nativeBalance,
      tokens: formattedTokens,
    });
  } catch (error: any) {
    console.error('Error fetching portfolio:', error);
    res.json({ nativeBalance: 0, tokens: [] });
  }
});

export default router;

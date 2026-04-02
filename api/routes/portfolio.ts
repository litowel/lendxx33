import { Router } from 'express';
import { ethers } from 'ethers';

const router = Router();

const SUPPORTED_TOKENS = [
  { symbol: 'USDC', address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', decimals: 6 },
  { symbol: 'DAI',  address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', decimals: 18 },
  { symbol: 'USDT', address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', decimals: 6 },
  { symbol: 'WETH', address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', decimals: 18 },
  { symbol: 'WBTC', address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599', decimals: 8 },
  { symbol: 'LINK', address: '0x514910771AF9Ca656af840dff83E8264EcF986CA', decimals: 18 },
  { symbol: 'AAVE', address: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9', decimals: 18 }
];

const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)"
];

router.all('/:address?', async (req, res) => {
  try {
    const address = req.params.address || req.body.address || req.query.address;
    
    if (!address || !ethers.isAddress(address)) {
      return res.json({ nativeBalance: "0", tokens: [] });
    }

    const provider = new ethers.JsonRpcProvider('https://eth.llamarpc.com');
    
    // Fetch native ETH balance
    const nativeBalanceWei = await provider.getBalance(address);
    const nativeBalance = ethers.formatEther(nativeBalanceWei);

    // Fetch token balances
    const tokens: any[] = [];
    
    // Fetch in parallel
    const balancePromises = SUPPORTED_TOKENS.map(async (token) => {
      try {
        const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
        const balanceWei = await contract.balanceOf(address);
        
        if (balanceWei > 0n) {
          const balance = ethers.formatUnits(balanceWei, token.decimals);
          return {
            symbol: token.symbol,
            balance: balance,
            address: token.address
          };
        }
      } catch (err) {
        console.error(`Error fetching balance for ${token.symbol}:`, err);
      }
      return null;
    });

    const results = await Promise.all(balancePromises);
    
    // Filter out nulls (tokens with 0 balance or errors)
    for (const result of results) {
      if (result) {
        tokens.push(result);
      }
    }

    res.json({
      nativeBalance,
      tokens
    });

  } catch (error: any) {
    console.error('Error fetching portfolio:', error);
    res.json({ nativeBalance: "0", tokens: [] });
  }
});

export default router;

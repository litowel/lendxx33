import { Router } from 'express';
import { BLUE_CHIP_COLLECTIONS } from '../../src/lib/constants';

const router = Router();

router.all('/', async (req, res) => {
  try {
    const address = req.body.address || req.query.address;
    
    if (!address) {
      return res.json({ nfts: [] });
    }

    const chainHex = req.body.chain || req.query.chain || '0x1';
    
    if (!process.env.MORALIS_API_KEY) {
      console.error("Missing Moralis API key for NFT fetch");
      return res.json({ nfts: [] });
    }

    const headers = {
      'accept': 'application/json',
      'X-API-Key': process.env.MORALIS_API_KEY
    };

    const nftRes = await fetch(`https://deep-index.moralis.io/api/v2.2/${address}/nft?chain=${chainHex}&format=decimal&media_items=true`, { headers });
    
    if (nftRes.ok) {
      const nftData = await nftRes.json();
      const nfts = nftData.result || [];
      return res.json({ nfts });
    } else {
      console.error(`Moralis NFT error: ${nftRes.status} ${nftRes.statusText}`);
      return res.json({ nfts: [] });
    }
  } catch (error: any) {
    console.error('Error fetching NFTs:', error);
    return res.json({ nfts: [] });
  }
});

router.get('/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const chainHex = (req.query.chain as string) || '0x1';
    
    if (!process.env.MORALIS_API_KEY) {
      console.error("Missing Moralis API key for NFT fetch");
      return res.json({ nfts: [] });
    }

    const headers = {
      'accept': 'application/json',
      'X-API-Key': process.env.MORALIS_API_KEY
    };

    let enrichedNfts: any[] = [];

    try {
      const nftRes = await fetch(`https://deep-index.moralis.io/api/v2/${address}/nft?chain=${chainHex}&format=decimal&media_items=true`, { headers });
      
      if (nftRes.ok) {
        const nftData = await nftRes.json();
        const nfts = nftData.result || [];

        const blueChipNfts = nfts.filter((nft: any) => 
          BLUE_CHIP_COLLECTIONS.includes(nft.token_address.toLowerCase())
        );

        const topNfts = blueChipNfts.slice(0, 10);

        enrichedNfts = await Promise.all(topNfts.map(async (nft: any) => {
          let floorPriceUsd = 0;
          
          if (process.env.OPENSEA_API_KEY) {
            try {
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
      } else {
        console.error(`Moralis NFT error: ${nftRes.status} ${nftRes.statusText}`);
      }
    } catch (fetchError) {
      console.error('Moralis NFT fetch error:', fetchError);
    }

    res.json({ nfts: enrichedNfts });
  } catch (error: any) {
    console.error('Error fetching NFTs:', error);
    res.json({ nfts: [] });
  }
});

router.get('/offers/:address/:tokenId', async (req, res) => {
  try {
    const { address, tokenId } = req.params;
    
    const isBlueChip = BLUE_CHIP_COLLECTIONS.includes(address.toLowerCase());
    if (!isBlueChip) {
      return res.json({ offers: [] });
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
    res.json({ offers: [] });
  }
});

export default router;

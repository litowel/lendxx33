import React, { useState, useEffect } from 'react';
import { Image, Shield, AlertTriangle, Activity, CheckCircle2, ExternalLink } from 'lucide-react';
import { NETWORKS } from '../lib/constants';

interface NFTCashProps {
  account: string;
  chainId: number;
  setError: (msg: string) => void;
  setTxStatus: (msg: string) => void;
}

export function NFTCash({ account, chainId, setError, setTxStatus }: NFTCashProps) {
  const [nfts, setNfts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNft, setSelectedNft] = useState<any | null>(null);
  
  const MAX_LTV = 0.40; // 40%

  useEffect(() => {
    if (account && chainId) {
      fetchNFTs();
    }
  }, [account, chainId]);

  const fetchNFTs = async () => {
    setLoading(true);
    try {
      const chainHex = NETWORKS[chainId]?.hex || '0x1';
      const response = await fetch(`/api/nft/${account}?chain=${chainHex}`);
      
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch NFTs: ${text}`);
      }
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setNfts(data.nfts || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load NFTs');
    } finally {
      setLoading(false);
    }
  };

  const maxBorrow = selectedNft ? selectedNft.floorPriceUsd * MAX_LTV : 0;

  const handleBlendRedirect = () => {
    if (!selectedNft) return;
    window.open(`https://blur.io/collection/${selectedNft.token_address}`, '_blank');
  };

  const handleBendDAORedirect = () => {
    window.open('https://www.benddao.xyz/', '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="bg-blue-600/20 p-3 rounded-xl border border-blue-500/30">
            <Image className="text-blue-400" size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">NFTCash™</h2>
            <p className="text-slate-400 mt-1">Unlock Cash From Your NFTs via Blend & BendDAO</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-6 relative z-10">
          <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
            <Shield size={16} className="text-green-400" /> No selling. Keep ownership.
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
            <Activity size={16} className="text-blue-400" /> Powered by existing DeFi liquidity.
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
            <AlertTriangle size={16} className="text-yellow-400" /> Max ~40% LTV.
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* NFT Grid */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Your Eligible NFTs</h3>
            <button onClick={fetchNFTs} className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
              Refresh
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : nfts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
              <Image size={48} className="mx-auto text-slate-600 mb-4" />
              <p className="text-slate-400">No eligible NFTs found in your wallet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {nfts.map((nft, idx) => {
                let metadata = nft.metadata;
                if (typeof metadata === 'string') {
                  try { metadata = JSON.parse(metadata); } catch (e) {}
                }
                
                const imageUrl = metadata?.image || metadata?.image_url || 'https://picsum.photos/seed/nft/200/200';
                const displayImage = imageUrl.startsWith('ipfs://') 
                  ? imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/') 
                  : imageUrl;

                const isSelected = selectedNft?.token_address === nft.token_address && selectedNft?.token_id === nft.token_id;

                return (
                  <div 
                    key={`${nft.token_address}-${nft.token_id}-${idx}`}
                    onClick={() => setSelectedNft(nft)}
                    className={`relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
                      isSelected ? 'border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'border-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="aspect-square bg-slate-800">
                      <img 
                        src={displayImage} 
                        alt={nft.name || 'NFT'} 
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/fallback/200/200'; }}
                      />
                    </div>
                    <div className="p-3 bg-slate-900">
                      <div className="text-xs text-slate-400 truncate">{nft.name || nft.symbol || 'Unknown Collection'}</div>
                      <div className="font-medium text-white text-sm truncate">#{nft.token_id}</div>
                      <div className="mt-2 text-xs font-mono text-blue-400">
                        Floor: ${nft.floorPriceUsd?.toFixed(2) || '0.00'}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="absolute top-2 right-2 bg-blue-500 rounded-full p-1 shadow-lg">
                        <CheckCircle2 size={16} className="text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Borrow Form */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-fit sticky top-24">
          <h3 className="text-xl font-bold text-white mb-6">Loan Details</h3>
          
          {!selectedNft ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Select an NFT from your wallet to view loan options.
            </div>
          ) : (
            <div className="space-y-6">
              {/* Selected NFT Summary */}
              <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                <div className="w-12 h-12 rounded-lg bg-slate-700 overflow-hidden shrink-0">
                  {(() => {
                    let metadata = selectedNft.metadata;
                    if (typeof metadata === 'string') {
                      try { metadata = JSON.parse(metadata); } catch (e) {}
                    }
                    const imageUrl = metadata?.image || metadata?.image_url || 'https://picsum.photos/seed/nft/200/200';
                    const displayImage = imageUrl.startsWith('ipfs://') ? imageUrl.replace('ipfs://', 'https://ipfs.io/ipfs/') : imageUrl;
                    return <img src={displayImage} alt="NFT" className="w-full h-full object-cover" />;
                  })()}
                </div>
                <div className="overflow-hidden">
                  <div className="text-sm font-medium text-white truncate">{selectedNft.name || 'Unknown'} #{selectedNft.token_id}</div>
                  <div className="text-xs text-slate-400">Est. Floor: ${selectedNft.floorPriceUsd?.toFixed(2)}</div>
                </div>
              </div>

              {/* Summary */}
              <div className="p-4 bg-slate-800/50 rounded-xl space-y-3 border border-slate-700 text-sm">
                <div className="flex justify-between text-slate-400">
                  <span>Max Borrow (Est.)</span>
                  <span className="text-blue-400 font-medium">${maxBorrow.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Liquidity Source</span>
                  <span className="text-white font-medium">Blend / BendDAO</span>
                </div>
              </div>

              {/* Warning */}
              <div className="flex items-start gap-2 text-xs text-blue-400 bg-blue-500/10 p-3 rounded-lg border border-blue-500/20">
                <Activity size={14} className="shrink-0 mt-0.5" />
                <p>You will be redirected to the official protocol to securely complete your loan using existing DeFi liquidity pools.</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleBlendRedirect}
                  className="w-full bg-[#FF8A00] hover:bg-[#E67A00] text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  Borrow on Blend (Blur) <ExternalLink size={16} />
                </button>
                
                <button
                  onClick={handleBendDAORedirect}
                  className="w-full bg-[#2B52F6] hover:bg-[#2344CC] text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-lg flex items-center justify-center gap-2"
                >
                  Borrow on BendDAO <ExternalLink size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


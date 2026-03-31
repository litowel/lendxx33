import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Image, Shield, AlertTriangle, Activity, CheckCircle2, RefreshCw, Zap, ExternalLink } from 'lucide-react';
import { NETWORKS, NFT_ROUTER_ADDRESSES } from '../lib/constants';

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
  
  const [offers, setOffers] = useState<any[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);
  
  const [isSigning, setIsSigning] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Mock active loan for Refinance demonstration
  const [activeLoan, setActiveLoan] = useState<any | null>(null);

  useEffect(() => {
    if (account && chainId) {
      fetchNFTs();
      // Mock an active loan for demonstration of the Refinance feature
      setActiveLoan({
        id: 'mock-loan-1',
        protocol: 'BendDAO',
        apr: 18.5,
        principal: 15.5,
        nftName: 'Bored Ape Yacht Club #1234',
        nftContract: '0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d',
        tokenId: '1234'
      });
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

  const fetchOffers = async (nft: any) => {
    setLoadingOffers(true);
    setSelectedOffer(null);
    try {
      const response = await fetch(`/api/nft/offers/${nft.token_address}/${nft.token_id}`);
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to fetch offers: ${text}`);
      }
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setOffers(data.offers || []);
      if (data.offers && data.offers.length > 0) {
        setSelectedOffer(data.offers[0]); // Auto-select best offer
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load offers');
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleSelectNft = (nft: any) => {
    setSelectedNft(nft);
    fetchOffers(nft);
  };

  const handleSignAndBorrow = async () => {
    if (!selectedNft || !selectedOffer) return;
    
    const routerAddress = NFT_ROUTER_ADDRESSES[chainId];
    if (!routerAddress || routerAddress === '0x0000000000000000000000000000000000000000') {
      setError('Router contract not deployed on this network.');
      return;
    }

    try {
      setError('');
      setIsSigning(true);
      setTxStatus('Requesting EIP-712 Signature from your wallet...');
      
      if (!window.ethereum) throw new Error("No wallet found");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // EIP-712 Domain
      const domain = {
        name: 'NFTCash',
        version: '1',
        chainId: chainId,
        verifyingContract: routerAddress
      };

      // EIP-712 Types
      const types = {
        LoanRequest: [
          { name: 'borrower', type: 'address' },
          { name: 'nftContract', type: 'address' },
          { name: 'tokenId', type: 'uint256' },
          { name: 'protocolAdapter', type: 'address' },
          { name: 'principal', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      };

      // Mock values for the prototype
      const principalWei = ethers.parseEther((selectedNft.floorPriceUsd * (selectedOffer.maxLtv / 100) / 3000).toFixed(4)); // Mock ETH conversion
      const nonce = Math.floor(Math.random() * 1000000); // In prod, fetch from contract
      const deadline = Math.floor(Date.now() / 1000) + 3600; // 1 hour

      const value = {
        borrower: account,
        nftContract: selectedNft.token_address,
        tokenId: selectedNft.token_id,
        protocolAdapter: selectedOffer.adapter,
        principal: principalWei,
        nonce: nonce,
        deadline: deadline
      };

      // Request Signature
      const signature = await signer.signTypedData(domain, types, value);
      
      setTxStatus('Signature received! Routing loan to ' + selectedOffer.protocol + '...');
      
      // In a real production environment, this signature would be sent to the backend, 
      // or directly submitted to the router contract by the user.
      // For this prototype, we simulate the submission delay.
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setTxStatus('Loan successfully originated via ' + selectedOffer.protocol + '! 0.5% platform fee captured.');
      setTimeout(() => setTxStatus(''), 5000);
      setShowModal(false);
      
    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || 'Signature failed');
      setTxStatus('');
    } finally {
      setIsSigning(false);
    }
  };

  const handleRefinance = async () => {
    try {
      setError('');
      setTxStatus('Initiating Flash Loan to pay off BendDAO...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setTxStatus('Migrating NFT to Blend...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setTxStatus('Refinance complete! You saved 10% APR.');
      setActiveLoan(null);
      setTimeout(() => setTxStatus(''), 4000);
    } catch (err: any) {
      setError('Refinance failed');
      setTxStatus('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="bg-blue-600/20 p-3 rounded-xl border border-blue-500/30">
            <Activity className="text-blue-400" size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">NFTCash™ Aggregator</h2>
            <p className="text-slate-400 mt-1">Non-Custodial Liquidity Router for Blue-Chip NFTs</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 mt-6 relative z-10">
          <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
            <Shield size={16} className="text-green-400" /> EIP-712 Non-Custodial Signatures.
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
            <Activity size={16} className="text-blue-400" /> Aggregates Blend, BendDAO, Gondi, Arcade.
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700">
            <RefreshCw size={16} className="text-purple-400" /> 1-Click Refinancing.
          </div>
        </div>
      </div>

      {/* Refinance Opportunities */}
      {activeLoan && (
        <div className="bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-2xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="text-yellow-400" size={24} />
            <h3 className="text-xl font-bold text-white">Refinance Opportunity Found!</h3>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1">
              <p className="text-slate-300 mb-2">
                Your active loan on <strong>{activeLoan.protocol}</strong> for <strong>{activeLoan.nftName}</strong> is currently at <span className="text-red-400 font-bold">{activeLoan.apr}% APR</span>.
              </p>
              <p className="text-slate-300">
                We found a new offer on <strong>Blend</strong> at <span className="text-green-400 font-bold">8.5% APR</span>. Refinance now to save on interest!
              </p>
            </div>
            <button
              onClick={handleRefinance}
              className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(147,51,234,0.3)] whitespace-nowrap"
            >
              1-Click Refinance
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* NFT Grid */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">Your Blue-Chip NFTs</h3>
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
              <p className="text-slate-400">No verified Blue-Chip NFTs found in your wallet.</p>
              <p className="text-xs text-slate-500 mt-2">Only top-tier collections (e.g., BAYC, Punks, Azuki) are supported to ensure deep liquidity.</p>
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
                    onClick={() => handleSelectNft(nft)}
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

        {/* Aggregator Offers */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-fit sticky top-24">
          <h3 className="text-xl font-bold text-white mb-6">Best Aggregated Offers</h3>
          
          {!selectedNft ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Select a Blue-Chip NFT to view liquidity offers across protocols.
            </div>
          ) : loadingOffers ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Selected NFT Summary */}
              <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700 mb-6">
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

              {/* Offers List */}
              <div className="space-y-3">
                {offers.map((offer, idx) => {
                  const isSelected = selectedOffer?.id === offer.id;
                  const isBest = idx === 0;

                  return (
                    <div 
                      key={offer.id}
                      onClick={() => setSelectedOffer(offer)}
                      className={`relative p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.2)]' 
                          : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {isBest && (
                        <div className="absolute -top-2.5 -right-2.5 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md">
                          BEST APR
                        </div>
                      )}
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-white">{offer.protocol}</span>
                        <span className="text-green-400 font-mono font-bold">{offer.apr.toFixed(2)}% APR</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Max LTV: {offer.maxLtv}%</span>
                        <span>{offer.duration}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary & Action */}
              {selectedOffer && (
                <div className="pt-4 mt-4 border-t border-slate-800">
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Platform Fee</span>
                    <span className="text-white">0.5% (Origination)</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400 mb-6">
                    <span>Max Borrow</span>
                    <span className="text-blue-400 font-bold">
                      ${(selectedNft.floorPriceUsd * (selectedOffer.maxLtv / 100)).toFixed(2)}
                    </span>
                  </div>

                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2"
                  >
                    Review Loan Terms
                  </button>
                  <p className="text-center text-xs text-slate-500 mt-3">
                    Uses EIP-712. Your private keys remain secure.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Loan Modal */}
      {showModal && selectedOffer && selectedNft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl max-w-md w-full relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>
            
            <h3 className="text-xl font-bold text-white mb-2">Confirm Loan Details</h3>
            <p className="text-slate-400 text-sm mb-6">
              You are about to complete this loan securely via <strong className="text-white">{selectedOffer.protocol}</strong>.
            </p>
            
            <div className="space-y-4 mb-6">
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Estimated APR</span>
                  <span className="text-green-400 font-bold">{selectedOffer.apr.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Max LTV</span>
                  <span className="text-white font-bold">{selectedOffer.maxLtv}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Liquidity Strength</span>
                  <span className="text-blue-400 font-bold">High</span>
                </div>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-3">
                <AlertTriangle className="text-blue-400 shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-blue-400">
                  Only blue-chip NFTs are supported due to liquidity requirements.
                </p>
              </div>
            </div>

            <button
              onClick={handleSignAndBorrow}
              disabled={isSigning}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSigning ? (
                <><div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div> Processing...</>
              ) : (
                <>Route to {selectedOffer.protocol}</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


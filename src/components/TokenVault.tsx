import React, { useState, useEffect } from 'react';
import { Coins, ArrowRight, ShieldCheck, Activity, AlertTriangle } from 'lucide-react';
import { NETWORKS, AAVE_ADDRESSES } from '../lib/constants';

interface TokenVaultProps {
  account: string;
  chainId: number;
  setError: (msg: string) => void;
  setTxStatus: (msg: string) => void;
}

export function TokenVault({ account, chainId, setError, setTxStatus }: TokenVaultProps) {
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState<any | null>(null);
  const [amountPercent, setAmountPercent] = useState<number>(0);

  useEffect(() => {
    if (account && chainId) {
      fetchTokens();
    }
  }, [account, chainId]);

  const fetchTokens = async () => {
    setLoading(true);
    try {
      const chainHex = NETWORKS[chainId]?.hex || '0x1';
      const response = await fetch(`/api/portfolio/${account}?chain=${chainHex}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch tokens');
      }
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setTokens(data.tokens || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectToken = (token: any) => {
    setSelectedToken(token);
    setAmountPercent(0);
  };

  const isSupported = selectedToken && ['USDC', 'DAI', 'USDT', 'WETH', 'WBTC', 'LINK', 'AAVE'].includes(selectedToken.symbol);

  const calculateAmount = () => {
    if (!selectedToken || amountPercent === 0) return 0;
    return (parseFloat(selectedToken.balanceFormatted) * (amountPercent / 100)).toFixed(4);
  };

  const calculateMaxBorrow = () => {
    if (!selectedToken || amountPercent === 0) return 0;
    const value = parseFloat(selectedToken.usdValue) * (amountPercent / 100);
    return (value * 0.8).toFixed(2); // Assuming 80% LTV
  };

  const handleAction = (action: 'deposit' | 'borrow') => {
    if (!selectedToken || amountPercent === 0) return;
    setTxStatus(`Initiating ${action} for ${calculateAmount()} ${selectedToken.symbol} via Aave...`);
    setTimeout(() => {
      setTxStatus(`${action.charAt(0).toUpperCase() + action.slice(1)} successful! Platform Fee: 0.5% applied.`);
      setTimeout(() => setTxStatus(''), 3000);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="bg-indigo-600/20 p-3 rounded-xl border border-indigo-500/30">
            <Coins className="text-indigo-400" size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">TokenVault™</h2>
            <p className="text-slate-400 mt-1">Use ERC-20 tokens as collateral and borrow instantly via Aave</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-6">Your ERC-20 Tokens</h3>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
              <p className="text-slate-400">No tokens found in your wallet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {tokens.map((token, idx) => {
                const isSelected = selectedToken?.token_address === token.token_address;
                return (
                  <div 
                    key={idx}
                    onClick={() => handleSelectToken(token)}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected ? 'bg-indigo-900/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {token.thumbnail ? (
                        <img src={token.thumbnail} alt={token.symbol} className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                          {token.symbol?.substring(0, 2)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-white">{token.symbol}</div>
                        <div className="text-xs text-slate-400">{token.name}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-white">{parseFloat(token.balanceFormatted).toFixed(4)}</div>
                      <div className="text-xs text-slate-400">${parseFloat(token.usdValue).toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-fit sticky top-24">
          <h3 className="text-xl font-bold text-white mb-6">Vault Actions</h3>
          
          {!selectedToken ? (
            <div className="text-center py-8 text-slate-500 text-sm">
              Select a token to view borrowing options.
            </div>
          ) : !isSupported ? (
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-yellow-400 flex items-start gap-3">
                <AlertTriangle className="shrink-0 mt-0.5" size={20} />
                <p className="text-sm">This asset is not supported for lending.</p>
              </div>
              <p className="text-sm text-slate-400 text-center">Suggest swap to ETH or USDC</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                {selectedToken.thumbnail ? (
                  <img src={selectedToken.thumbnail} alt={selectedToken.symbol} className="w-10 h-10 rounded-full" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white">
                    {selectedToken.symbol?.substring(0, 2)}
                  </div>
                )}
                <div>
                  <div className="font-bold text-white">{selectedToken.symbol}</div>
                  <div className="text-sm text-slate-400">Balance: {parseFloat(selectedToken.balanceFormatted).toFixed(4)}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-2">Select Amount</label>
                <div className="grid grid-cols-4 gap-2">
                  {[25, 50, 75, 100].map(pct => (
                    <button
                      key={pct}
                      onClick={() => setAmountPercent(pct)}
                      className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                        amountPercent === pct ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {amountPercent > 0 && (
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Selected Amount</span>
                    <span className="text-white font-mono">{calculateAmount()} {selectedToken.symbol}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Max Borrow Estimate</span>
                    <span className="text-green-400 font-mono font-bold">${calculateMaxBorrow()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Platform Fee</span>
                    <span className="text-white">0.5%</span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleAction('deposit')}
                  disabled={amountPercent === 0}
                  className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                >
                  Deposit
                </button>
                <button
                  onClick={() => handleAction('borrow')}
                  disabled={amountPercent === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50"
                >
                  Borrow
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-lg">
        <h3 className="text-xl font-bold text-white mb-6">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { step: 1, title: "Select asset", desc: "Choose an ERC-20 token from your wallet" },
            { step: 2, title: "Choose amount", desc: "Select 25%, 50%, 75%, or 100% of your balance" },
            { step: 3, title: "Deposit as collateral", desc: "Supply your tokens securely to Aave" },
            { step: 4, title: "Borrow instantly", desc: "Get instant liquidity against your collateral" }
          ].map((s, i) => (
            <div key={i} className="bg-slate-800/50 p-5 rounded-xl border border-slate-700 relative">
              <div className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold mb-3 border border-indigo-500/30">
                {s.step}
              </div>
              <h4 className="text-white font-semibold mb-1">{s.title}</h4>
              <p className="text-slate-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

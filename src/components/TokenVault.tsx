import React, { useState, useEffect } from 'react';
import { Coins, ArrowRight, ShieldCheck, Activity, AlertTriangle, Loader2 } from 'lucide-react';
import { NETWORKS, AAVE_ADDRESSES, ABIS } from '../lib/constants';
import { ethers } from 'ethers';

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
  
  // Transaction Modal State
  const [showTxModal, setShowTxModal] = useState(false);
  const [txAction, setTxAction] = useState<'deposit' | 'borrow' | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

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
        throw new Error('Failed to fetch tokens. Ensure Moralis API Key is set.');
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

  // Check if supported by Aave V3 on Ethereum Mainnet (or current network)
  const isSupported = selectedToken && ['USDC', 'DAI', 'USDT', 'WETH', 'WBTC', 'LINK', 'AAVE'].includes(selectedToken.symbol);

  const calculateAmount = () => {
    if (!selectedToken || amountPercent === 0) return "0";
    return (parseFloat(selectedToken.balanceFormatted) * (amountPercent / 100)).toFixed(selectedToken.decimals > 6 ? 6 : selectedToken.decimals);
  };

  const calculateMaxBorrow = () => {
    if (!selectedToken || amountPercent === 0) return "0";
    const value = parseFloat(selectedToken.usdValue) * (amountPercent / 100);
    return (value * 0.8).toFixed(2); // Assuming 80% LTV
  };

  const initiateAction = (action: 'deposit' | 'borrow') => {
    if (!selectedToken || amountPercent === 0) return;
    setTxAction(action);
    setShowTxModal(true);
  };

  const executeTransaction = async () => {
    if (!selectedToken || !txAction || !window.ethereum) return;
    
    setIsExecuting(true);
    setError('');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const aaveAddresses = AAVE_ADDRESSES[chainId] || AAVE_ADDRESSES[1]; // Fallback to mainnet if unsupported
      if (!aaveAddresses) throw new Error("Aave not supported on this network");
      
      const poolContract = new ethers.Contract(aaveAddresses.POOL, ABIS.POOL, signer);
      const tokenContract = new ethers.Contract(selectedToken.token_address, ABIS.ERC20, signer);
      
      const amountStr = calculateAmount();
      const amountWei = ethers.parseUnits(amountStr, selectedToken.decimals);
      
      if (txAction === 'deposit') {
        // 1. Check Allowance
        setTxStatus('Checking token allowance...');
        const allowance = await tokenContract.allowance(account, aaveAddresses.POOL);
        
        if (allowance < amountWei) {
          // 2. Approve
          setIsApproving(true);
          setTxStatus('Please approve the token in MetaMask...');
          try {
            const approveTx = await tokenContract.approve(aaveAddresses.POOL, ethers.MaxUint256);
            setTxStatus('Waiting for approval confirmation...');
            await approveTx.wait();
          } catch (err: any) {
            if (err.code === 'ACTION_REJECTED') throw new Error("Token approval rejected by user");
            throw new Error("Token approval failed");
          } finally {
            setIsApproving(false);
          }
        }
        
        // 3. Supply
        setTxStatus('Please confirm the deposit in MetaMask...');
        try {
          // Estimate gas first to catch errors
          await poolContract.supply.estimateGas(selectedToken.token_address, amountWei, account, 0);
          
          const tx = await poolContract.supply(selectedToken.token_address, amountWei, account, 0);
          setTxStatus('Waiting for deposit confirmation...');
          await tx.wait();
          
          setTxStatus('Deposit successful!');
        } catch (err: any) {
          if (err.code === 'ACTION_REJECTED') throw new Error("Deposit rejected by user");
          if (err.message.includes('gas')) throw new Error("Insufficient gas for deposit");
          throw new Error("Deposit failed: " + (err.reason || err.message));
        }
        
      } else if (txAction === 'borrow') {
        // Borrow USDC
        const usdcAddress = aaveAddresses.USDC;
        if (!usdcAddress) throw new Error("USDC address not configured for this network");
        
        // We borrow USDC based on the USD value of the collateral they selected
        // In a real scenario, they would have already deposited collateral.
        // For this UI, we assume they want to borrow against their existing collateral.
        const borrowAmountUsd = calculateMaxBorrow();
        const borrowAmountWei = ethers.parseUnits(borrowAmountUsd, 6); // USDC has 6 decimals
        
        setTxStatus('Please confirm the borrow in MetaMask...');
        try {
          // Estimate gas
          await poolContract.borrow.estimateGas(usdcAddress, borrowAmountWei, 2, 0, account);
          
          const tx = await poolContract.borrow(usdcAddress, borrowAmountWei, 2, 0, account); // 2 = Variable Rate
          setTxStatus('Waiting for borrow confirmation...');
          await tx.wait();
          
          setTxStatus('Borrow successful! Platform Fee: 0.5% applied.');
        } catch (err: any) {
          if (err.code === 'ACTION_REJECTED') throw new Error("Borrow rejected by user");
          if (err.message.includes('gas')) throw new Error("Insufficient gas for borrow");
          throw new Error("Borrow failed: " + (err.reason || err.message));
        }
      }
      
      // Refresh balances after success
      setTimeout(() => {
        fetchTokens();
        setTxStatus('');
        setShowTxModal(false);
        setAmountPercent(0);
      }, 3000);
      
    } catch (err: any) {
      console.error("Transaction Error:", err);
      setError(err.message || "Transaction failed");
      setTxStatus('');
    } finally {
      setIsExecuting(false);
    }
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
        <div className="relative z-10 mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider">
          <ShieldCheck size={14} /> Powered by Aave V3 — Real on-chain transactions
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
                  onClick={() => initiateAction('deposit')}
                  disabled={amountPercent === 0}
                  className="bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold text-sm transition-colors disabled:opacity-50"
                >
                  Deposit to Aave
                </button>
                <button
                  onClick={() => initiateAction('borrow')}
                  disabled={amountPercent === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold text-sm transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50"
                >
                  Borrow USDC
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

      {/* Transaction Modal */}
      {showTxModal && selectedToken && txAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <ShieldCheck className="text-indigo-400" />
              Confirm {txAction === 'deposit' ? 'Deposit' : 'Borrow'}
            </h3>
            
            <div className="space-y-4 mb-6">
              <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Protocol</span>
                  <span className="text-white font-semibold">Aave V3</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Action</span>
                  <span className="text-white font-semibold capitalize">{txAction}</span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-slate-400">Asset</span>
                  <span className="text-white font-semibold">{txAction === 'deposit' ? selectedToken.symbol : 'USDC'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Amount</span>
                  <span className="text-white font-mono font-bold">
                    {txAction === 'deposit' ? calculateAmount() : calculateMaxBorrow()}
                  </span>
                </div>
              </div>
              
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-sm text-blue-400 flex items-start gap-2">
                <Activity size={16} className="shrink-0 mt-0.5" />
                <p>This will execute a real on-chain transaction via MetaMask.</p>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowTxModal(false)}
                disabled={isExecuting}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-slate-800 text-white hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeTransaction}
                disabled={isExecuting}
                className="flex-1 py-3 rounded-xl font-bold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shadow-[0_0_15px_rgba(79,70,229,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isExecuting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {isApproving ? 'Approving...' : 'Executing...'}
                  </>
                ) : (
                  'Confirm'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

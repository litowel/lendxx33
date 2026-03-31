import React, { useState } from 'react';
import { Zap, ArrowRight, AlertTriangle, PlayCircle } from 'lucide-react';

export function FlashBuilder() {
  const [strategyType, setStrategyType] = useState('Arbitrage');
  const [asset, setAsset] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [expectedProfit, setExpectedProfit] = useState('');
  const [strategyOutput, setStrategyOutput] = useState('');

  const handleGenerate = () => {
    if (!amount || !expectedProfit) return;
    
    let output = '';
    if (strategyType === 'Arbitrage') {
      output = `Borrow ${amount} ${asset} via Aave Flash Loan\nBuy ${asset} on Uniswap\nSell ${asset} on SushiSwap\nRepay ${amount} ${asset} + 0.05% fee\nKeep ${expectedProfit} ${asset} profit`;
    } else if (strategyType === 'Liquidation') {
      output = `Borrow ${amount} ${asset} via Flash Loan\nLiquidate undercollateralized position on Compound\nReceive collateral at discount\nSwap collateral for ${asset} on 1inch\nRepay ${amount} ${asset} + fee\nKeep ${expectedProfit} ${asset} profit`;
    } else {
      output = `Borrow ${amount} ${asset} via Flash Loan\nPay off debt on MakerDAO\nWithdraw collateral\nDeposit collateral on Aave\nBorrow ${asset} against new collateral\nRepay Flash Loan + fee\nKeep ${expectedProfit} ${asset} profit`;
    }
    
    setStrategyOutput(output);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="bg-yellow-600/20 p-3 rounded-xl border border-yellow-500/30">
            <Zap className="text-yellow-400" size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">FlashBuilder™</h2>
            <p className="text-slate-400 mt-1">No-code flash loan strategy simulator</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-6">Configure Strategy</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Strategy Type</label>
              <select 
                value={strategyType}
                onChange={(e) => setStrategyType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
              >
                <option value="Arbitrage">Arbitrage</option>
                <option value="Liquidation">Liquidation</option>
                <option value="Debt Refinancing">Debt Refinancing</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Asset</label>
              <select 
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
              >
                <option value="USDC">USDC</option>
                <option value="ETH">ETH</option>
                <option value="DAI">DAI</option>
                <option value="WBTC">WBTC</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Flash Loan Amount</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 100000"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Expected Profit</label>
              <input 
                type="number" 
                value={expectedProfit}
                onChange={(e) => setExpectedProfit(e.target.value)}
                placeholder="e.g. 500"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={!amount || !expectedProfit}
              className="w-full mt-4 bg-yellow-600 hover:bg-yellow-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(202,138,4,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <PlayCircle size={18} /> Generate Strategy
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-6">Strategy Output</h3>
          
          {strategyOutput ? (
            <div className="space-y-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 font-mono text-sm text-green-400 whitespace-pre-line leading-relaxed">
                {strategyOutput}
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="text-blue-400 shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-blue-400 font-semibold mb-1">Simulation Only</p>
                  <p className="text-slate-400 text-sm">Advanced users can deploy a smart contract to execute this logic on-chain. This tool does not execute real flash loans.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl">
              <Zap size={48} className="mb-4 opacity-20" />
              <p>Configure and generate a strategy to see the execution steps.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { Layers, CheckCircle2, ArrowRight } from 'lucide-react';

export function FractionalLoans() {
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="bg-emerald-600/20 p-3 rounded-xl border border-emerald-500/30">
            <Layers className="text-emerald-400" size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">Fractional Loans™</h2>
            <p className="text-slate-400 mt-1">Borrow against fractional ownership of tokenized real-world assets</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-6">Tokenized Assets</h3>
          
          <div className="space-y-4">
            {[
              { name: "Real Estate Property #402", type: "Real Estate", value: "$500,000", share: "5%", shareValue: "$25,000" },
              { name: "Startup Equity Pool A", type: "Business", value: "$2,000,000", share: "1%", shareValue: "$20,000" },
              { name: "Fine Art Collection", type: "Art", value: "$1,500,000", share: "2%", shareValue: "$30,000" }
            ].map((asset, i) => (
              <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex justify-between items-center hover:border-emerald-500/50 transition-colors cursor-pointer">
                <div>
                  <h4 className="text-white font-semibold">{asset.name}</h4>
                  <p className="text-slate-400 text-sm">{asset.type} • Total Value: {asset.value}</p>
                </div>
                <div className="text-right">
                  <p className="text-emerald-400 font-bold">{asset.share} Share</p>
                  <p className="text-slate-400 text-sm">{asset.shareValue}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 bg-slate-800 hover:bg-slate-700 text-white py-3.5 rounded-xl font-bold transition-colors border border-slate-700 flex items-center justify-center gap-2">
            View Future Liquidity Pools <ArrowRight size={18} />
          </button>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl font-bold text-white mb-6">How it works</h3>
          
          <div className="space-y-6">
            {[
              { step: 1, title: "Tokenize asset", desc: "Real-world assets are tokenized on-chain into fractional shares." },
              { step: 2, title: "Hold fractional tokens", desc: "Purchase or hold tokens representing partial ownership." },
              { step: 3, title: "Use as collateral", desc: "Deposit your fractional tokens into our smart contracts." },
              { step: 4, title: "Borrow against share", desc: "Instantly borrow stablecoins against your share value." }
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/30">
                  {s.step}
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">{s.title}</h4>
                  <p className="text-slate-400 text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="text-emerald-400 shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-emerald-400 font-semibold mb-1">Coming Soon</p>
              <p className="text-slate-400 text-sm">This feature is currently in development. Fractional asset borrowing will be available in Q3.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, TrendingUp, Zap, BrainCircuit, ShieldCheck, 
  Clock, Coins, Lock, Activity, BarChart, Globe, 
  Layers, ArrowRight, CheckCircle2, PlayCircle
} from 'lucide-react';

const LENDING_BENEFITS = [
  "Instant Liquidity", "No Credit Checks", "Keep Your Upside", "Tax Efficiency",
  "Flexible Repayment", "Low Interest Rates", "Multi-Chain Support", "High LTV Ratios",
  "Real-Time Yield", "Secure Smart Contracts", "Non-Custodial", "24/7 Access",
  "Auto-Compounding", "Flash Repay", "Collateral Swaps", "Zero Hidden Fees",
  "Transparent APY", "Deep Liquidity", "Institutional Grade", "Overcollateralized Safety"
];

const FLASH_BENEFITS = [
  "Zero Upfront Capital", "Instant Execution", "Risk-Free Arbitrage", "One-Block Settlement",
  "No Collateral Needed", "Infinite Scalability", "Automated Routing", "Low Gas Overhead",
  "MEV Protection", "Multi-DEX Support", "Debt Refinancing", "Collateral Swapping",
  "Liquidation Hunting", "Atomic Transactions", "Yield Farming Boost", "Open Source Logic",
  "High Success Rate", "Protocol Agnostic", "Developer Friendly", "Max Capital Efficiency"
];

const AI_BENEFITS = [
  "24/7 Market Analysis", "Predictive Modeling", "Risk Scoring", "Portfolio Optimization",
  "Sentiment Analysis", "Smart Contract Audits", "Yield Forecasting", "Automated Alerts",
  "Custom Strategies", "Real-Time Data", "Deep Learning Engine", "Institutional Metrics",
  "Whale Tracking", "Gas Optimization", "Impermanent Loss Calc", "Trend Identification",
  "Backtesting Engine", "Actionable Insights", "Multi-Chain Context", "Beginner Friendly"
];

const LENDING_STEPS = [
  { title: "Connect Wallet", desc: "Link your Web3 wallet securely." },
  { title: "Supply Assets", desc: "Deposit crypto to earn yield." },
  { title: "Borrow Funds", desc: "Use deposits as collateral to borrow." },
  { title: "Manage Position", desc: "Monitor health factor and repay anytime." }
];

const FLASH_STEPS = [
  { title: "Identify Opportunity", desc: "Find arbitrage or liquidation targets." },
  { title: "Request Loan", desc: "Borrow millions with zero collateral." },
  { title: "Execute Logic", desc: "Run your custom smart contract logic." },
  { title: "Repay in 1 Block", desc: "Return funds + fee instantly." }
];

const AI_STEPS = [
  { title: "Ask a Question", desc: "Type your DeFi query or strategy idea." },
  { title: "AI Analysis", desc: "Engine processes real-time market data." },
  { title: "Review Insights", desc: "Get institutional-grade risk metrics." },
  { title: "Execute Strategy", desc: "Apply the optimized plan to your portfolio." }
];

const LENDING_SLIDES = [
  { title: "Earn Passive Yield", img: "https://picsum.photos/seed/finance/800/400?blur=2", icon: <TrendingUp size={32} /> },
  { title: "Borrow Against Crypto", img: "https://picsum.photos/seed/crypto/800/400?blur=2", icon: <Coins size={32} /> },
  { title: "Bankless Freedom", img: "https://picsum.photos/seed/vault/800/400?blur=2", icon: <Globe size={32} /> }
];

const FLASH_SLIDES = [
  { title: "Zero-Collateral Power", img: "https://picsum.photos/seed/lightning/800/400?blur=2", icon: <Zap size={32} /> },
  { title: "Arbitrage Mastery", img: "https://picsum.photos/seed/network/800/400?blur=2", icon: <Layers size={32} /> },
  { title: "Atomic Execution", img: "https://picsum.photos/seed/blockchain/800/400?blur=2", icon: <Clock size={32} /> }
];

const AI_SLIDES = [
  { title: "Predictive Analytics", img: "https://picsum.photos/seed/data/800/400?blur=2", icon: <BarChart size={32} /> },
  { title: "Risk Mitigation", img: "https://picsum.photos/seed/security/800/400?blur=2", icon: <ShieldCheck size={32} /> },
  { title: "Smart Contract Audits", img: "https://picsum.photos/seed/code/800/400?blur=2", icon: <Lock size={32} /> }
];

const BenefitGrid = ({ benefits }: { benefits: string[] }) => (
  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-8">
    {benefits.map((b, i) => (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.02 }}
        key={i} 
        className="flex items-center gap-2 bg-slate-800/40 border border-slate-700/50 p-2.5 rounded-lg hover:bg-slate-700/60 transition-colors"
      >
        <CheckCircle2 size={14} className="text-blue-400 shrink-0" />
        <span className="text-xs font-medium text-slate-300 truncate">{b}</span>
      </motion.div>
    ))}
  </div>
);

const StepTutorial = ({ steps }: { steps: {title: string, desc: string}[] }) => (
  <div className="flex flex-col md:flex-row gap-4 mt-10">
    {steps.map((s, i) => (
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true }}
        transition={{ delay: i * 0.1 }}
        key={i} 
        className="flex-1 relative"
      >
        <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700 p-5 rounded-xl h-full relative z-10 hover:border-blue-500/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center font-bold mb-3 border border-blue-500/30">
            {i + 1}
          </div>
          <h4 className="text-white font-semibold mb-1">{s.title}</h4>
          <p className="text-slate-400 text-sm">{s.desc}</p>
        </div>
        {i < steps.length - 1 && (
          <div className="hidden md:block absolute top-1/2 -right-3 w-6 h-0.5 bg-slate-700 z-0"></div>
        )}
      </motion.div>
    ))}
  </div>
);

const Slider = ({ slides }: { slides: {title: string, img: string, icon: any}[] }) => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((p) => (p + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl mt-10 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <img src={slides[current].img} alt="Slide" className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/60 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 p-8 flex items-center gap-4">
            <div className="p-4 bg-blue-600/20 backdrop-blur-md rounded-xl border border-blue-500/30 text-blue-400">
              {slides[current].icon}
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white tracking-tight">{slides[current].title}</h3>
              <p className="text-slate-300 text-sm mt-1">Experience the future of decentralized finance.</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      <div className="absolute bottom-4 right-4 flex gap-2">
        {slides.map((_, i) => (
          <button 
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-blue-500 w-6' : 'bg-slate-600'}`}
          />
        ))}
      </div>
    </div>
  );
};

export const HomeSections = ({ onConnect }: { onConnect: () => void }) => {
  return (
    <div className="space-y-32 py-12">
      
      {/* Section 1: Lending */}
      <section className="relative">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-6"
          >
            <Wallet size={16} /> Lending Protocol
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight"
          >
            Unlock Liquidity Without <br className="hidden md:block" /> Selling Your Crypto
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400"
          >
            Deposit your digital assets to earn passive yield, or use them as collateral to borrow instantly. No credit checks, no middlemen.
          </motion.p>
        </div>

        <Slider slides={LENDING_SLIDES} />
        <StepTutorial steps={LENDING_STEPS} />
        <BenefitGrid benefits={LENDING_BENEFITS} />

        <div className="mt-12 text-center">
          <button onClick={onConnect} className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(37,99,235,0.4)]">
            Start Lending Now <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Section 2: Flash Loans */}
      <section className="relative">
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-medium mb-6"
          >
            <Zap size={16} /> Flash Loans
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight"
          >
            Arbitrage & Liquidate <br className="hidden md:block" /> With Zero Capital
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400"
          >
            Borrow millions of dollars instantly with no collateral required. Execute complex arbitrage strategies in a single transaction block.
          </motion.p>
        </div>

        <Slider slides={FLASH_SLIDES} />
        <StepTutorial steps={FLASH_STEPS} />
        <BenefitGrid benefits={FLASH_BENEFITS} />

        <div className="mt-12 text-center">
          <button onClick={onConnect} className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(147,51,234,0.4)]">
            Try Flash Loans <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Section 3: AI Advisor */}
      <section className="relative">
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-sm font-medium mb-6"
          >
            <BrainCircuit size={16} /> AI Intelligence
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight"
          >
            Quantitative Risk Intelligence <br className="hidden md:block" /> At Your Fingertips
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400"
          >
            Leverage our institutional-grade AI engine to analyze market conditions, optimize your portfolio, and mitigate smart contract risks.
          </motion.p>
        </div>

        <Slider slides={AI_SLIDES} />
        <StepTutorial steps={AI_STEPS} />
        <BenefitGrid benefits={AI_BENEFITS} />

        <div className="mt-12 text-center">
          <button onClick={onConnect} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(79,70,229,0.4)]">
            Ask AI Advisor <ArrowRight size={18} />
          </button>
        </div>
      </section>

    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, TrendingUp, Zap, BrainCircuit, ShieldCheck, 
  Clock, Coins, Lock, Activity, BarChart, Globe, 
  Layers, ArrowRight, CheckCircle2, PlayCircle, Image
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

const NFTCASH_BENEFITS = [
  "Non-Custodial", "Aggregated Liquidity", "Zero Selling Pressure", "Instant Cash",
  "1-Click Refinancing", "Gasless Signatures", "Flash Loan Payoffs", "Blue-Chip Support",
  "No Credit Checks", "Keep Airdrop Rights", "Transparent Fees", "Multi-Protocol",
  "Best APR Routing", "Flexible Durations", "High LTV Ratios", "Liquidation Protection",
  "Seamless UI/UX", "Real-Time Floor Tracking", "Secure Architecture", "Global Access"
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

const NFTCASH_STEPS = [
  { title: "Connect Wallet", desc: "Link your wallet holding Blue-Chip NFTs." },
  { title: "Select NFT", desc: "Choose an eligible NFT from your portfolio." },
  { title: "Compare Offers", desc: "View aggregated loan offers (Blend, BendDAO, etc.)." },
  { title: "Sign & Route", desc: "Sign gasless EIP-712 transaction to receive funds." }
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

const NFTCASH_SLIDES = [
  { title: "Unlock NFT Liquidity", img: "https://picsum.photos/seed/nftart/800/400?blur=2", icon: <Image size={32} /> },
  { title: "Aggregated Offers", img: "https://picsum.photos/seed/liquidity/800/400?blur=2", icon: <Layers size={32} /> },
  { title: "Keep Your Assets", img: "https://picsum.photos/seed/vault/800/400?blur=2", icon: <ShieldCheck size={32} /> }
];

const TOKENVAULT_BENEFITS = [
  "Use ERC-20s as Collateral", "Instant Aave Integration", "No Selling Required", "Keep Asset Upside",
  "Multi-Token Support", "Real-Time USD Values", "One-Click Borrowing", "Flexible LTV Options",
  "Zero Hidden Fees", "Non-Custodial", "Secure Smart Contracts", "Auto-Routing",
  "High Liquidity", "Transparent Rates", "Gas Optimized", "Portfolio Tracking",
  "Instant Withdrawals", "Risk Management", "Beginner Friendly", "24/7 Availability"
];

const TOKENVAULT_STEPS = [
  { title: "Select Asset", desc: "Choose an ERC-20 token from your wallet." },
  { title: "Choose Amount", desc: "Select 25%, 50%, 75%, or 100% of your balance." },
  { title: "Deposit Collateral", desc: "Supply your tokens securely to Aave." },
  { title: "Borrow Instantly", desc: "Get instant liquidity against your collateral." }
];

const TOKENVAULT_SLIDES = [
  { title: "ERC-20 Collateral", img: "https://picsum.photos/seed/erc20/800/400?blur=2", icon: <Coins size={32} /> },
  { title: "Instant Liquidity", img: "https://picsum.photos/seed/liquidity2/800/400?blur=2", icon: <Zap size={32} /> },
  { title: "Keep Your Assets", img: "https://picsum.photos/seed/vault2/800/400?blur=2", icon: <ShieldCheck size={32} /> }
];

const FLASHBUILDER_BENEFITS = [
  "No-Code Interface", "Strategy Simulation", "Zero Capital Required", "Arbitrage Modeling",
  "Liquidation Hunting", "Debt Refinancing", "Instant Feedback", "Risk-Free Testing",
  "Educational Tool", "Step-by-Step Logic", "Multi-Asset Support", "Profit Estimation",
  "Visual Builder", "Protocol Agnostic", "Safe Environment", "Advanced Strategies",
  "DeFi Composability", "Clear Explanations", "Beginner Friendly", "100% Free to Use"
];

const FLASHBUILDER_STEPS = [
  { title: "Choose Strategy", desc: "Select Arbitrage, Liquidation, or Refinancing." },
  { title: "Select Asset", desc: "Choose the token you want to borrow." },
  { title: "Set Parameters", desc: "Input the loan amount and expected profit." },
  { title: "Generate Logic", desc: "View the step-by-step execution plan." }
];

const FLASHBUILDER_SLIDES = [
  { title: "No-Code Builder", img: "https://picsum.photos/seed/builder/800/400?blur=2", icon: <Layers size={32} /> },
  { title: "Strategy Simulation", img: "https://picsum.photos/seed/simulation/800/400?blur=2", icon: <Activity size={32} /> },
  { title: "Risk-Free Testing", img: "https://picsum.photos/seed/testing/800/400?blur=2", icon: <ShieldCheck size={32} /> }
];

const FRACTIONAL_BENEFITS = [
  "Real Estate Backed", "Business Equity", "Fine Art Collateral", "Micro-Borrowing",
  "High Liquidity Pools", "Diversified Risk", "Global Access", "Transparent Valuation",
  "Instant Cash", "No Credit Checks", "Keep Ownership", "Fractional Shares",
  "On-Chain Proof", "Secure Custody", "Low Interest Rates", "Flexible Terms",
  "Automated Escrow", "24/7 Markets", "Democratized Finance", "Future-Proof DeFi"
];

const FRACTIONAL_STEPS = [
  { title: "Tokenize Asset", desc: "Real-world assets are tokenized on-chain." },
  { title: "Hold Shares", desc: "Purchase or hold fractional tokens." },
  { title: "Use as Collateral", desc: "Deposit tokens into our smart contracts." },
  { title: "Borrow Instantly", desc: "Borrow stablecoins against your share." }
];

const FRACTIONAL_SLIDES = [
  { title: "Real-World Assets", img: "https://picsum.photos/seed/realestate/800/400?blur=2", icon: <Globe size={32} /> },
  { title: "Fractional Ownership", img: "https://picsum.photos/seed/fractional/800/400?blur=2", icon: <Layers size={32} /> },
  { title: "Instant Liquidity", img: "https://picsum.photos/seed/cash/800/400?blur=2", icon: <Coins size={32} /> }
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

const CreateEligibleNFTGuide = () => (
  <div className="mt-16 bg-slate-900/50 border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
    <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
    <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-3 relative z-10">
      <ShieldCheck className="text-blue-400" size={28} /> How to Create an Eligible NFT Collection
    </h3>
    <p className="text-slate-400 mb-8 relative z-10 max-w-3xl">
      NFTCash™ Aggregator routes liquidity exclusively for "Blue-Chip" NFT collections to ensure deep liquidity and minimize risk for lenders. If you are a creator looking to make your collection eligible, follow these industry standards:
    </p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
      <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2"><Activity size={18} className="text-blue-400"/> 1. High Trading Volume</h4>
        <p className="text-sm text-slate-400 leading-relaxed">Maintain consistent, high daily trading volume on major secondary marketplaces like Blur and OpenSea. Volume proves demand and liquidity.</p>
      </div>
      <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2"><TrendingUp size={18} className="text-green-400"/> 2. Stable Floor Price</h4>
        <p className="text-sm text-slate-400 leading-relaxed">Demonstrate a resilient floor price over an extended period. High volatility increases liquidation risks for lenders and prevents protocol whitelisting.</p>
      </div>
      <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2"><CheckCircle2 size={18} className="text-purple-400"/> 3. Marketplace Verification</h4>
        <p className="text-sm text-slate-400 leading-relaxed">Ensure your collection is verified (blue checkmark) on top platforms to establish trust, authenticity, and protect against counterfeit collections.</p>
      </div>
      <div className="bg-slate-800/40 p-6 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-colors">
        <h4 className="text-white font-semibold mb-3 flex items-center gap-2"><Layers size={18} className="text-orange-400"/> 4. Protocol Integration</h4>
        <p className="text-sm text-slate-400 leading-relaxed">Lobby for inclusion in foundational lending protocols (Blend, BendDAO, Arcade). Our aggregator automatically supports collections whitelisted by these underlying protocols.</p>
      </div>
    </div>
  </div>
);

const HERO_SLIDES = [
  { title: "LendX Pro Aggregator", desc: "Your home for instant DeFi lending, trading, and non-crypto instant lending protocols.", img: "https://picsum.photos/seed/defi/1200/600?blur=2", icon: <Globe size={40} /> },
  { title: "TokenVault™", desc: "Use your ERC-20 tokens as instant collateral on Aave V3.", img: "https://picsum.photos/seed/erc20/1200/600?blur=2", icon: <Coins size={40} /> },
  { title: "FlashBuilder™", desc: "No-code flash loan strategy simulator for arbitrage and liquidations.", img: "https://picsum.photos/seed/builder/1200/600?blur=2", icon: <Layers size={40} /> },
  { title: "NFTCash™ Aggregator", desc: "Unlock liquidity from Blue-Chip NFTs across multiple protocols.", img: "https://picsum.photos/seed/nftart/1200/600?blur=2", icon: <Image size={40} /> },
  { title: "Fractional Loans™", desc: "Borrow against tokenized real estate, business equity, and fine art.", img: "https://picsum.photos/seed/fractional/1200/600?blur=2", icon: <Activity size={40} /> },
  { title: "AI Risk Advisor", desc: "Quantitative risk intelligence and actionable portfolio advice.", img: "https://picsum.photos/seed/data/1200/600?blur=2", icon: <BrainCircuit size={40} /> }
];

const HeroSlider = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((p) => (p + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full h-80 md:h-[400px] rounded-3xl overflow-hidden border border-slate-700 shadow-2xl mb-24 group">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          <img src={HERO_SLIDES[current].img} alt="Hero Slide" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/40 to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 p-8 md:p-12 flex flex-col md:flex-row items-start md:items-center gap-6 w-full">
            <div className="p-5 bg-blue-600/20 backdrop-blur-md rounded-2xl border border-blue-500/30 text-blue-400 shrink-0">
              {HERO_SLIDES[current].icon}
            </div>
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-3">{HERO_SLIDES[current].title}</h2>
              <p className="text-slate-300 text-lg md:text-xl">{HERO_SLIDES[current].desc}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      <div className="absolute bottom-6 right-8 flex gap-3">
        {HERO_SLIDES.map((_, i) => (
          <button 
            key={i}
            onClick={() => setCurrent(i)}
            className={`h-2 rounded-full transition-all ${i === current ? 'bg-blue-500 w-8' : 'bg-slate-600 w-2 hover:bg-slate-500'}`}
          />
        ))}
      </div>
    </div>
  );
};

export const HomeSections = ({ onConnect }: { onConnect: () => void }) => {
  return (
    <div className="space-y-32 py-12">
      
      <HeroSlider />

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

      {/* Section 1.5: TokenVault */}
      <section className="relative">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium mb-6"
          >
            <Coins size={16} /> TokenVault™
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight"
          >
            Your ERC-20 Tokens <br className="hidden md:block" /> as Instant Collateral
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400"
          >
            Deposit supported ERC-20 tokens into Aave V3 and borrow instantly. Maximize your portfolio's utility without selling your favorite assets.
          </motion.p>
        </div>

        <Slider slides={TOKENVAULT_SLIDES} />
        <StepTutorial steps={TOKENVAULT_STEPS} />
        <BenefitGrid benefits={TOKENVAULT_BENEFITS} />

        <div className="mt-12 text-center">
          <button onClick={onConnect} className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]">
            Enter TokenVault <ArrowRight size={18} />
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

      {/* Section 2.5: FlashBuilder */}
      <section className="relative">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm font-medium mb-6"
          >
            <Zap size={16} /> FlashBuilder™
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight"
          >
            No-Code Flash Loan <br className="hidden md:block" /> Strategy Simulator
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400"
          >
            Simulate complex arbitrage, liquidation, and debt refinancing strategies without writing a single line of Solidity code.
          </motion.p>
        </div>

        <Slider slides={FLASHBUILDER_SLIDES} />
        <StepTutorial steps={FLASHBUILDER_STEPS} />
        <BenefitGrid benefits={FLASHBUILDER_BENEFITS} />

        <div className="mt-12 text-center">
          <button onClick={onConnect} className="inline-flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(202,138,4,0.4)]">
            Build a Strategy <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Section 3: NFTCash Aggregator */}
      <section className="relative">
        <div className="absolute top-1/2 left-0 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium mb-6"
          >
            <Image size={16} /> NFTCash™ Aggregator
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight"
          >
            Unlock NFT Liquidity <br className="hidden md:block" /> Across All Protocols
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400"
          >
            Get the best loan offers from Blend, BendDAO, Arcade, and Gondi in one place. Use your Blue-Chip NFTs as collateral without selling them.
          </motion.p>
        </div>

        <Slider slides={NFTCASH_SLIDES} />
        <StepTutorial steps={NFTCASH_STEPS} />
        <BenefitGrid benefits={NFTCASH_BENEFITS} />
        
        <CreateEligibleNFTGuide />

        <div className="mt-12 text-center">
          <button onClick={onConnect} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
            Explore NFTCash <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Section 3.5: Fractional Loans */}
      <section className="relative">
        <div className="absolute top-1/2 right-0 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2"></div>
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-medium mb-6"
          >
            <Layers size={16} /> Fractional Loans™
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight"
          >
            Borrow Against <br className="hidden md:block" /> Fractional Ownership
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-400"
          >
            Unlock liquidity from tokenized real estate, business equity, and fine art. The future of lending is fractional.
          </motion.p>
        </div>

        <Slider slides={FRACTIONAL_SLIDES} />
        <StepTutorial steps={FRACTIONAL_STEPS} />
        <BenefitGrid benefits={FRACTIONAL_BENEFITS} />

        <div className="mt-12 text-center">
          <button onClick={onConnect} className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(245,158,11,0.4)]">
            Learn About Fractional Loans <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Section 4: AI Advisor */}
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

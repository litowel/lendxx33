import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';

declare global {
  interface Window {
    ethereum?: any;
  }
}

import { 
  Wallet, 
  LogOut, 
  ArrowRightLeft, 
  Activity, 
  Coins, 
  Zap, 
  BrainCircuit, 
  AlertTriangle,
  ChevronDown,
  Info
} from 'lucide-react';
import { NETWORKS, AAVE_ADDRESSES, ABIS, ADMIN_WALLET } from './lib/constants';

function App() {
  // Wallet & Network State
  const [account, setAccount] = useState<string>('');
  const [chainId, setChainId] = useState<number>(11155111); // Default to Sepolia
  
  // UI State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'lending' | 'flash' | 'ai'>('dashboard');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [txStatus, setTxStatus] = useState<string>('');
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);

  // Data State
  const [balance, setBalance] = useState<string>('0');
  const [tokens, setTokens] = useState<any[]>([]);
  const [aaveData, setAaveData] = useState({
    collateral: '0',
    borrowed: '0',
    availableBorrows: '0',
    healthFactor: '0',
  });

  // Input State
  const [depositAmount, setDepositAmount] = useState('');
  const [borrowAmount, setBorrowAmount] = useState('');
  const [repayAmount, setRepayAmount] = useState('');
  
  // Flash Loan State
  const [flashReceiver, setFlashReceiver] = useState('');
  const [flashAsset, setFlashAsset] = useState('USDC');
  const [flashAmount, setFlashAmount] = useState('');
  const [expectedRevenue, setExpectedRevenue] = useState('');

  // AI State
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState<any>(null);

  // --------------------------------------------------------------------------
  // WALLET & NETWORK LOGIC
  // --------------------------------------------------------------------------

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
          fetchData(accounts[0], chainId);
        } else {
          disconnectWallet();
        }
      });

      window.ethereum.on('chainChanged', (newChainIdHex: string) => {
        const newChainId = parseInt(newChainIdHex, 16);
        setChainId(newChainId);
        if (account) fetchData(account, newChainId);
      });

      // Get initial chain ID
      window.ethereum.request({ method: 'eth_chainId' }).then((hex: string) => {
        setChainId(parseInt(hex, 16));
      });
    }
  }, [account]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('Please install MetaMask to use this app.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      await fetchData(accounts[0], chainId);
    } catch (err: any) {
      if (err.code === -32002) {
        setError('MetaMask is already processing a connection request. Please open MetaMask.');
      } else {
        setError('Failed to connect wallet.');
      }
    } finally {
      setLoading(false);
    }
  };

  const switchAccount = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }]
      });
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      await fetchData(accounts[0], chainId);
    } catch (err) {
      console.error(err);
    }
  };

  const disconnectWallet = () => {
    setAccount('');
    setBalance('0');
    setTokens([]);
    setAaveData({ collateral: '0', borrowed: '0', availableBorrows: '0', healthFactor: '0' });
    setAiData(null);
  };

  const switchNetwork = async (targetChainId: number) => {
    if (!window.ethereum) return;
    const targetHex = NETWORKS[targetChainId]?.hex;
    if (!targetHex) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetHex }],
      });
      setIsNetworkDropdownOpen(false);
    } catch (error: any) {
      setError(`Failed to switch network. Please add it to MetaMask manually.`);
    }
  };

  // --------------------------------------------------------------------------
  // DATA FETCHING
  // --------------------------------------------------------------------------

  const fetchData = async (userAddress: string, currentChainId: number) => {
    setLoading(true);
    await Promise.all([
      fetchPortfolioData(userAddress, currentChainId),
      fetchAaveData(userAddress, currentChainId)
    ]);
    setLoading(false);
  };

  const fetchPortfolioData = async (userAddress: string, currentChainId: number) => {
    try {
      const chainHex = NETWORKS[currentChainId]?.hex || '0x1';
      const response = await fetch(`/api/portfolio/${userAddress}?chain=${chainHex}`);
      const data = await response.json();
      
      if (data.error) {
        console.warn(data.error);
        return;
      }

      setBalance(ethers.formatEther(data.native.balance));
      setTokens(data.tokens);
    } catch (err) {
      console.error('Error fetching portfolio:', err);
    }
  };

  const fetchAaveData = async (userAddress: string, currentChainId: number) => {
    if (!AAVE_ADDRESSES[currentChainId]) {
      setAaveData({ collateral: '0', borrowed: '0', availableBorrows: '0', healthFactor: '0' });
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const poolContract = new ethers.Contract(AAVE_ADDRESSES[currentChainId].POOL, ABIS.POOL, provider);
      
      const data = await poolContract.getUserAccountData(userAddress);
      
      setAaveData({
        collateral: ethers.formatUnits(data.totalCollateralBase, 8),
        borrowed: ethers.formatUnits(data.totalDebtBase, 8),
        availableBorrows: ethers.formatUnits(data.availableBorrowsBase, 8),
        healthFactor: data.healthFactor.toString() === '115792089237316195423570985008687907853269984665640564039457584007913129639935' ? '∞' : ethers.formatUnits(data.healthFactor, 18)
      });
    } catch (err) {
      console.error('Error fetching Aave data:', err);
    }
  };

  // --------------------------------------------------------------------------
  // LENDING LOGIC (AAVE V3)
  // --------------------------------------------------------------------------

  const estimateGasCost = async (contract: ethers.Contract, method: string, args: any[], value: bigint = 0n) => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const gasEstimate = await contract[method].estimateGas(...args, { value });
      const feeData = await provider.getFeeData();
      if (feeData.gasPrice) {
        const gasCost = gasEstimate * feeData.gasPrice;
        return ethers.formatEther(gasCost);
      }
      return "0";
    } catch (e) {
      console.warn("Gas estimation failed", e);
      return null;
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || !AAVE_ADDRESSES[chainId]) return;
    try {
      setError('');
      setTxStatus('Estimating gas...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const wethGateway = new ethers.Contract(AAVE_ADDRESSES[chainId].WETH_GATEWAY, ABIS.WETH_GATEWAY, signer);
      
      const amountInWei = ethers.parseEther(depositAmount);
      const feeInWei = (amountInWei * 2n) / 1000n; // 0.2% fee
      const netAmountInWei = amountInWei - feeInWei;
      
      const gasCost = await estimateGasCost(wethGateway, 'depositETH', [AAVE_ADDRESSES[chainId].POOL, account, 0], netAmountInWei);
      if (gasCost) {
        const confirm = window.confirm(`Estimated Gas Cost: ${Number(gasCost).toFixed(6)} ETH. Proceed?`);
        if (!confirm) {
          setTxStatus('');
          return;
        }
      }

      setTxStatus('Step 1/2: Paying 0.2% Platform Fee...');
      const feeTx = await signer.sendTransaction({ to: ADMIN_WALLET, value: feeInWei });
      await feeTx.wait();

      setTxStatus('Step 2/2: Depositing to Aave...');
      const tx = await wethGateway.depositETH(AAVE_ADDRESSES[chainId].POOL, account, 0, { value: netAmountInWei });
      
      setTxStatus('Transaction pending...');
      await tx.wait();
      
      setTxStatus('Deposit successful!');
      setDepositAmount('');
      fetchData(account, chainId);
      setTimeout(() => setTxStatus(''), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || 'Deposit failed');
      setTxStatus('');
    }
  };

  const handleBorrow = async () => {
    if (!borrowAmount || !AAVE_ADDRESSES[chainId]) return;
    try {
      setError('');
      setTxStatus('Estimating gas...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const pool = new ethers.Contract(AAVE_ADDRESSES[chainId].POOL, ABIS.POOL, signer);
      
      const amountInWei = ethers.parseUnits(borrowAmount, 6); // USDC has 6 decimals
      const feeInWei = (amountInWei * 5n) / 1000n; // 0.5% fee
      
      const gasCost = await estimateGasCost(pool, 'borrow', [AAVE_ADDRESSES[chainId].USDC, amountInWei, 2, 0, account]);
      if (gasCost) {
        const confirm = window.confirm(`Estimated Gas Cost: ${Number(gasCost).toFixed(6)} ETH. Proceed?`);
        if (!confirm) {
          setTxStatus('');
          return;
        }
      }

      setTxStatus('Step 1/2: Borrowing from Aave...');
      const tx = await pool.borrow(AAVE_ADDRESSES[chainId].USDC, amountInWei, 2, 0, account);
      await tx.wait();

      setTxStatus('Step 2/2: Paying 0.5% Platform Fee...');
      const usdc = new ethers.Contract(AAVE_ADDRESSES[chainId].USDC, ABIS.ERC20, signer);
      const feeTx = await usdc.transfer(ADMIN_WALLET, feeInWei);
      await feeTx.wait();
      
      setTxStatus('Borrow successful!');
      setBorrowAmount('');
      fetchData(account, chainId);
      setTimeout(() => setTxStatus(''), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || 'Borrow failed');
      setTxStatus('');
    }
  };

  const handleRepay = async () => {
    if (!repayAmount || !AAVE_ADDRESSES[chainId]) return;
    try {
      setError('');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const usdc = new ethers.Contract(AAVE_ADDRESSES[chainId].USDC, ABIS.ERC20, signer);
      const pool = new ethers.Contract(AAVE_ADDRESSES[chainId].POOL, ABIS.POOL, signer);
      
      const amountInWei = ethers.parseUnits(repayAmount, 6);

      // Check allowance
      setTxStatus('Checking USDC allowance...');
      const allowance = await usdc.allowance(account, AAVE_ADDRESSES[chainId].POOL);
      
      if (allowance < amountInWei) {
        setTxStatus('Please approve USDC for repayment...');
        const approveTx = await usdc.approve(AAVE_ADDRESSES[chainId].POOL, ethers.MaxUint256);
        await approveTx.wait();
      }

      setTxStatus('Estimating gas...');
      const gasCost = await estimateGasCost(pool, 'repay', [AAVE_ADDRESSES[chainId].USDC, amountInWei, 2, account]);
      if (gasCost) {
        const confirm = window.confirm(`Estimated Gas Cost: ${Number(gasCost).toFixed(6)} ETH. Proceed?`);
        if (!confirm) {
          setTxStatus('');
          return;
        }
      }

      setTxStatus('Please confirm the repay transaction in MetaMask...');
      const tx = await pool.repay(AAVE_ADDRESSES[chainId].USDC, amountInWei, 2, account);
      
      setTxStatus('Transaction pending...');
      await tx.wait();
      
      setTxStatus('Repayment successful!');
      setRepayAmount('');
      fetchData(account, chainId);
      setTimeout(() => setTxStatus(''), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || 'Repayment failed');
      setTxStatus('');
    }
  };

  const setMaxSafeBorrow = () => {
    // Target 80% of available borrows to keep a safe health factor
    const safeAmount = parseFloat(aaveData.availableBorrows) * 0.8;
    setBorrowAmount(safeAmount.toFixed(2));
  };

  // --------------------------------------------------------------------------
  // FLASH LOAN LOGIC
  // --------------------------------------------------------------------------

  const handleFlashLoan = async () => {
    if (!flashReceiver || !flashAmount || !AAVE_ADDRESSES[chainId]) {
      setError('Please fill in all flash loan fields.');
      return;
    }
    try {
      setError('');
      setTxStatus('Estimating gas...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const pool = new ethers.Contract(AAVE_ADDRESSES[chainId].POOL, ABIS.POOL, signer);
      
      const assetAddress = flashAsset === 'USDC' ? AAVE_ADDRESSES[chainId].USDC : AAVE_ADDRESSES[chainId].WETH;
      const decimals = flashAsset === 'USDC' ? 6 : 18;
      const amountInWei = ethers.parseUnits(flashAmount, decimals);
      const feeInWei = (amountInWei * 1n) / 1000n; // 0.1% fee
      
      const gasCost = await estimateGasCost(pool, 'flashLoanSimple', [flashReceiver, assetAddress, amountInWei, "0x", 0]);
      if (gasCost) {
        const confirm = window.confirm(`Estimated Gas Cost: ${Number(gasCost).toFixed(6)} ETH. Proceed?`);
        if (!confirm) {
          setTxStatus('');
          return;
        }
      }

      setTxStatus('Step 1/2: Paying 0.1% Upfront Fee...');
      const token = new ethers.Contract(assetAddress, ABIS.ERC20, signer);
      const feeTx = await token.transfer(ADMIN_WALLET, feeInWei);
      await feeTx.wait();

      setTxStatus('Step 2/2: Executing Flash Loan...');
      const tx = await pool.flashLoanSimple(flashReceiver, assetAddress, amountInWei, "0x", 0);
      
      setTxStatus('Transaction pending...');
      await tx.wait();
      
      setTxStatus('Flash Loan executed successfully! Profit distributed by smart contract.');
      setFlashAmount('');
      setExpectedRevenue('');
      setTimeout(() => setTxStatus(''), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.reason || err.message || 'Flash Loan failed. Ensure your receiver contract is deployed and funded for the premium.');
      setTxStatus('');
    }
  };

  // --------------------------------------------------------------------------
  // AI ADVISOR LOGIC
  // --------------------------------------------------------------------------

  const getAIRecommendation = async () => {
    setAiLoading(true);
    setError('');
    try {
      const response = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolio: { balance, tokens },
          aaveData,
          chainId
        })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setAiData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to get AI recommendation');
    } finally {
      setAiLoading(false);
    }
  };

  // --------------------------------------------------------------------------
  // RENDER HELPERS
  // --------------------------------------------------------------------------

  const renderNetworkSwitcher = () => (
    <div className="relative">
      <button 
        onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
        className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors border border-slate-700"
      >
        <div className={`w-2 h-2 rounded-full ${NETWORKS[chainId] ? 'bg-green-400' : 'bg-red-400'}`}></div>
        {NETWORKS[chainId]?.name || 'Unsupported Network'}
        <ChevronDown size={16} />
      </button>
      
      {isNetworkDropdownOpen && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
          {Object.entries(NETWORKS).map(([id, network]) => (
            <button
              key={id}
              onClick={() => switchNetwork(Number(id))}
              className={`w-full text-left px-4 py-3 hover:bg-slate-700 transition-colors ${Number(id) === chainId ? 'text-blue-400 font-medium bg-slate-700/50' : 'text-slate-300'}`}
            >
              {network.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Activity className="text-white" size={24} />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">LendX <span className="text-blue-500">Pro</span></span>
            </div>
            
            <div className="flex items-center gap-4">
              {account && renderNetworkSwitcher()}
              
              {!account ? (
                <button
                  onClick={connectWallet}
                  disabled={loading}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  <Wallet size={18} />
                  {loading ? 'Connecting...' : 'Connect Wallet'}
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="hidden md:block px-4 py-2 bg-slate-800 rounded-lg border border-slate-700 font-mono text-sm text-slate-300">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </div>
                  <button
                    onClick={switchAccount}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors border border-slate-700"
                    title="Switch Account"
                  >
                    <ArrowRightLeft size={18} />
                  </button>
                  <button
                    onClick={disconnectWallet}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors border border-red-500/20"
                    title="Disconnect"
                  >
                    <LogOut size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Global Warnings/Errors */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 text-red-400">
            <AlertTriangle className="shrink-0 mt-0.5" size={20} />
            <p>{error}</p>
          </div>
        )}
        
        {txStatus && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3 text-blue-400">
            <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
            <p>{txStatus}</p>
          </div>
        )}

        {!AAVE_ADDRESSES[chainId] && account && (
          <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3 text-yellow-400">
            <AlertTriangle className="shrink-0 mt-0.5" size={20} />
            <p>Aave V3 is not supported on {NETWORKS[chainId]?.name || 'this network'} in this demo. Please switch to Ethereum Mainnet or Sepolia Testnet.</p>
          </div>
        )}

        {!account ? (
          <div className="text-center py-32">
            <div className="bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700">
              <Wallet size={48} className="text-slate-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Welcome to LendX Pro</h2>
            <p className="text-slate-400 max-w-md mx-auto mb-8">
              Connect your wallet to access multi-chain lending, flash loans, and AI-powered DeFi strategies.
            </p>
            <button
              onClick={connectWallet}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-medium transition-colors text-lg"
            >
              Connect Wallet to Start
            </button>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex overflow-x-auto hide-scrollbar border-b border-slate-800 mb-8">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'dashboard' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                <Wallet size={18} /> Portfolio
              </button>
              <button 
                onClick={() => setActiveTab('lending')}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'lending' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                <Coins size={18} /> Lending (Aave)
              </button>
              <button 
                onClick={() => setActiveTab('flash')}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'flash' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                <Zap size={18} /> Flash Loans
              </button>
              <button 
                onClick={() => setActiveTab('ai')}
                className={`flex items-center gap-2 px-6 py-4 font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === 'ai' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
              >
                <BrainCircuit size={18} /> AI Advisor
              </button>
            </div>

            {/* Tab Content: Dashboard */}
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-medium text-slate-300 mb-2">Native Balance</h3>
                  <div className="text-4xl font-bold text-white font-mono">
                    {parseFloat(balance).toFixed(4)} <span className="text-slate-500 text-2xl">ETH</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                  <h3 className="text-lg font-medium text-slate-300 mb-4">Token Balances</h3>
                  {tokens.length === 0 ? (
                    <p className="text-slate-500">No tokens found on this network.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tokens.map((token, idx) => (
                        <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {token.logo ? (
                              <img src={token.logo} alt={token.symbol} className="w-8 h-8 rounded-full" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">
                                {token.symbol.slice(0, 2)}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-white">{token.symbol}</div>
                              <div className="text-xs text-slate-400">{token.name}</div>
                            </div>
                          </div>
                          <div className="font-mono font-medium text-white">
                            {(Number(token.balance) / Math.pow(10, token.decimals)).toFixed(4)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab Content: Lending */}
            {activeTab === 'lending' && AAVE_ADDRESSES[chainId] && (
              <div className="space-y-6">
                {/* Aave Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="text-sm text-slate-400 mb-1">Total Collateral (USD)</div>
                    <div className="text-3xl font-bold text-white font-mono">${parseFloat(aaveData.collateral).toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="text-sm text-slate-400 mb-1">Total Borrowed (USD)</div>
                    <div className="text-3xl font-bold text-white font-mono">${parseFloat(aaveData.borrowed).toFixed(2)}</div>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="text-sm text-slate-400 mb-1">Health Factor</div>
                    <div className={`text-3xl font-bold font-mono ${
                      aaveData.healthFactor === '∞' || parseFloat(aaveData.healthFactor) > 2 ? 'text-green-400' : 
                      parseFloat(aaveData.healthFactor) > 1.1 ? 'text-yellow-400' : 'text-red-400'
                    }`}>
                      {aaveData.healthFactor === '∞' ? '∞' : parseFloat(aaveData.healthFactor).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Deposit */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-4">Deposit ETH</h3>
                    <p className="text-sm text-slate-400 mb-4">Supply ETH to Aave V3 to earn interest and use as collateral.</p>
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="number"
                          value={depositAmount}
                          onChange={(e) => setDepositAmount(e.target.value)}
                          placeholder="0.0"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <div className="absolute right-4 top-3 text-slate-400 font-medium">ETH</div>
                      </div>
                      {depositAmount && !isNaN(Number(depositAmount)) && Number(depositAmount) > 0 && (
                        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg text-sm space-y-1 border border-slate-700">
                          <div className="flex justify-between text-slate-400">
                            <span>Platform Fee (0.2%)</span>
                            <span className="text-red-400">-{ (Number(depositAmount) * 0.002).toFixed(6) } ETH</span>
                          </div>
                          <div className="flex justify-between text-slate-300 font-medium pt-1 border-t border-slate-700/50">
                            <span>Net Deposit to Aave</span>
                            <span className="text-green-400">{ (Number(depositAmount) * 0.998).toFixed(6) } ETH</span>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleDeposit}
                      disabled={!depositAmount || isNaN(Number(depositAmount)) || Number(depositAmount) <= 0}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Deposit
                    </button>
                  </div>

                  {/* Borrow */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white">Borrow USDC</h3>
                      <button onClick={setMaxSafeBorrow} className="text-xs bg-slate-800 hover:bg-slate-700 text-blue-400 px-2 py-1 rounded border border-slate-700 transition-colors">
                        Max Safe
                      </button>
                    </div>
                    <p className="text-sm text-slate-400 mb-4">Borrow USDC against your deposited ETH collateral.</p>
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="number"
                          value={borrowAmount}
                          onChange={(e) => setBorrowAmount(e.target.value)}
                          placeholder="0.0"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <div className="absolute right-4 top-3 text-slate-400 font-medium">USDC</div>
                      </div>
                      <div className="text-xs text-slate-500 mt-2 text-right">
                        Available: ${parseFloat(aaveData.availableBorrows).toFixed(2)}
                      </div>
                      {borrowAmount && !isNaN(Number(borrowAmount)) && Number(borrowAmount) > 0 && (
                        <div className="mt-3 p-3 bg-slate-800/50 rounded-lg text-sm space-y-1 border border-slate-700">
                          <div className="flex justify-between text-slate-400">
                            <span>Platform Fee (0.5%)</span>
                            <span className="text-red-400">-{ (Number(borrowAmount) * 0.005).toFixed(2) } USDC</span>
                          </div>
                          <div className="flex justify-between text-slate-300 font-medium pt-1 border-t border-slate-700/50">
                            <span>Net Received</span>
                            <span className="text-green-400">{ (Number(borrowAmount) * 0.995).toFixed(2) } USDC</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1">
                            * Fee is deducted in a separate transaction immediately after borrowing.
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={handleBorrow}
                      disabled={!borrowAmount || isNaN(Number(borrowAmount)) || Number(borrowAmount) <= 0}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Borrow
                    </button>
                  </div>

                  {/* Repay */}
                  <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-white mb-4">Repay USDC</h3>
                    <p className="text-sm text-slate-400 mb-4">Repay your borrowed USDC to improve your health factor.</p>
                    <div className="mb-4">
                      <div className="relative">
                        <input
                          type="number"
                          value={repayAmount}
                          onChange={(e) => setRepayAmount(e.target.value)}
                          placeholder="0.0"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-blue-500 transition-colors"
                        />
                        <div className="absolute right-4 top-3 text-slate-400 font-medium">USDC</div>
                      </div>
                    </div>
                    <button
                      onClick={handleRepay}
                      disabled={!repayAmount || isNaN(Number(repayAmount)) || Number(repayAmount) <= 0}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Repay
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: Flash Loans */}
            {activeTab === 'flash' && AAVE_ADDRESSES[chainId] && (
              <div className="max-w-2xl mx-auto">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
                      <Zap className="text-yellow-400" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Flash Loan Engine</h2>
                      <p className="text-slate-400">Borrow millions instantly with zero collateral.</p>
                    </div>
                  </div>

                  <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-start gap-3 text-blue-300 text-sm">
                    <Info className="shrink-0 mt-0.5" size={18} />
                    <div>
                      <strong>Developer Note:</strong> To execute a real flash loan, you must deploy a custom Receiver Smart Contract that handles the arbitrage logic and repays the loan within the same transaction. 
                      <br/><br/>
                      We have provided a template contract in <code className="bg-slate-800 px-1 rounded text-blue-200">src/contracts/FlashLoanReceiver.sol</code>. Deploy it via Remix, fund it for the premium fee, and paste its address below.
                    </div>
                  </div>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Receiver Contract Address</label>
                      <input
                        type="text"
                        value={flashReceiver}
                        onChange={(e) => setFlashReceiver(e.target.value)}
                        placeholder="0x..."
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-yellow-500 transition-colors"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Asset</label>
                        <select
                          value={flashAsset}
                          onChange={(e) => setFlashAsset(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-medium focus:outline-none focus:border-yellow-500 transition-colors appearance-none"
                        >
                          <option value="USDC">USDC</option>
                          <option value="WETH">WETH</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Amount</label>
                        <input
                          type="number"
                          value={flashAmount}
                          onChange={(e) => setFlashAmount(e.target.value)}
                          placeholder="10000"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-yellow-500 transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">Expected Arbitrage Revenue (Gross)</label>
                      <input
                        type="number"
                        value={expectedRevenue}
                        onChange={(e) => setExpectedRevenue(e.target.value)}
                        placeholder="e.g., 50"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-yellow-500 transition-colors"
                      />
                    </div>

                    {flashAmount && expectedRevenue && !isNaN(Number(flashAmount)) && !isNaN(Number(expectedRevenue)) && (
                      <div className="mt-4 p-4 bg-slate-800/50 rounded-xl text-sm space-y-2 border border-slate-700">
                        <div className="flex justify-between text-slate-400">
                          <span>Flash Loan Amount</span>
                          <span>{flashAmount} {flashAsset}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Upfront Fee (0.1%)</span>
                          <span className="text-red-400">-{ (Number(flashAmount) * 0.001).toFixed(4) } {flashAsset}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Aave Premium (0.05%)</span>
                          <span className="text-red-400">-{ (Number(flashAmount) * 0.0005).toFixed(4) } {flashAsset}</span>
                        </div>
                        <div className="flex justify-between text-slate-400">
                          <span>Expected Revenue</span>
                          <span className="text-green-400">+{ Number(expectedRevenue).toFixed(4) } {flashAsset}</span>
                        </div>
                        
                        { (Number(expectedRevenue) - (Number(flashAmount) * 0.0005)) > 0 ? (
                          <>
                            <div className="flex justify-between text-slate-300 font-medium pt-2 border-t border-slate-700/50">
                              <span>Gross Profit (Revenue - Premium)</span>
                              <span>{ (Number(expectedRevenue) - (Number(flashAmount) * 0.0005)).toFixed(4) } {flashAsset}</span>
                            </div>
                            <div className="flex justify-between text-slate-400">
                              <span>Profit Share (20% of Gross)</span>
                              <span className="text-red-400">-{ ((Number(expectedRevenue) - (Number(flashAmount) * 0.0005)) * 0.2).toFixed(4) } {flashAsset}</span>
                            </div>
                            <div className="flex justify-between text-white font-bold pt-2 border-t border-slate-700/50">
                              <span>Your Net Profit (After all fees)</span>
                              <span className={((Number(expectedRevenue) - (Number(flashAmount) * 0.0005)) * 0.8 - (Number(flashAmount) * 0.001)) > 0 ? "text-green-400" : "text-red-400"}>
                                { (((Number(expectedRevenue) - (Number(flashAmount) * 0.0005)) * 0.8) - (Number(flashAmount) * 0.001)).toFixed(4) } {flashAsset}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-2 text-center">
                              * 0.1% fee is paid upfront. Profit share is distributed automatically by the smart contract.
                            </div>
                          </>
                        ) : (
                          <div className="pt-2 border-t border-slate-700/50 text-red-400 font-medium text-center">
                            Strategy is not profitable. Revenue must exceed Aave Premium.
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={handleFlashLoan}
                      disabled={!flashReceiver || !flashAmount}
                      className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900 py-4 rounded-xl font-bold text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
                    >
                      <Zap size={20} /> Execute Flash Loan
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Content: AI Advisor */}
            {activeTab === 'ai' && (
              <div className="max-w-3xl mx-auto">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-lg">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/20">
                      <BrainCircuit className="text-purple-400" size={24} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">AI Risk & Strategy Advisor</h2>
                      <p className="text-slate-400">Powered by Gemini 1.5 Pro</p>
                    </div>
                  </div>

                  {!aiData && !aiLoading && (
                    <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-xl">
                      <BrainCircuit size={48} className="mx-auto text-slate-600 mb-4" />
                      <p className="text-slate-400 mb-6 max-w-md mx-auto">
                        Let our AI analyze your cross-chain portfolio and Aave positions to recommend safe borrowing limits and yield strategies.
                      </p>
                      <button
                        onClick={getAIRecommendation}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
                      >
                        Analyze My Portfolio
                      </button>
                    </div>
                  )}

                  {aiLoading && (
                    <div className="text-center py-16">
                      <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-purple-400 animate-pulse">AI is analyzing blockchain data...</p>
                    </div>
                  )}

                  {aiData && !aiLoading && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                          <div className="text-sm text-slate-400 mb-1">Safe Borrow Limit</div>
                          <div className="text-2xl font-bold text-white font-mono">${aiData.safeBorrowLimitUSD}</div>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                          <div className="text-sm text-slate-400 mb-1">Recommended Asset</div>
                          <div className="text-2xl font-bold text-blue-400">{aiData.recommendedAssetToBorrow}</div>
                        </div>
                        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                          <div className="text-sm text-slate-400 mb-1">Risk Level</div>
                          <div className={`text-2xl font-bold ${
                            aiData.riskLevel === 'Low' ? 'text-green-400' : 
                            aiData.riskLevel === 'Medium' ? 'text-yellow-400' : 'text-red-400'
                          }`}>
                            {aiData.riskLevel}
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                        <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                          <Activity size={16} className="text-blue-400" /> Health Factor Analysis
                        </h4>
                        <p className="text-slate-300 leading-relaxed">{aiData.healthFactorAnalysis}</p>
                      </div>

                      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                        <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                          <Zap size={16} className="text-yellow-400" /> Actionable Advice
                        </h4>
                        <ul className="space-y-3">
                          {aiData.actionableAdvice.map((advice: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-3 text-slate-300">
                              <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0"></div>
                              <span className="leading-relaxed">{advice}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="text-center pt-4">
                        <button
                          onClick={getAIRecommendation}
                          className="text-sm text-slate-400 hover:text-white transition-colors underline underline-offset-4"
                        >
                          Refresh Analysis
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;

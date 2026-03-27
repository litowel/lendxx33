import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, LogOut, RefreshCw, AlertCircle, Coins, List } from 'lucide-react';

export default function App() {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [moralisStatus, setMoralisStatus] = useState<boolean | null>(null);

  useEffect(() => {
    // Check if Moralis is configured
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setMoralisStatus(data.moralis))
      .catch(() => setMoralisStatus(false));

    // Check if wallet is already connected
    checkIfWalletIsConnected();
  }, []);

  useEffect(() => {
    if (account) {
      fetchPortfolio(account);
    }
  }, [account]);

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window as any;
      if (!ethereum) return;

      const accounts = await ethereum.request({ method: 'eth_accounts' });
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
    }
  };

  const connectWallet = async () => {
    try {
      setError(null);
      const { ethereum } = window as any;

      if (!ethereum) {
        setError('MetaMask is not installed. Please install it to use this app.');
        return;
      }

      setLoading(true);
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      setError(error.message || 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setBalance(null);
    setTokens([]);
  };

  const fetchPortfolio = async (address: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/portfolio/${address}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch portfolio');
      }

      // Set native ETH balance
      if (data.native?.balance) {
        const balanceInEth = ethers.formatEther(data.native.balance);
        setBalance(parseFloat(balanceInEth).toFixed(4));
      }

      // Set ERC20 token balances
      if (data.tokens) {
        setTokens(data.tokens);
      }
    } catch (error: any) {
      console.error('Error fetching portfolio:', error);
      setError(error.message || 'Failed to fetch portfolio');
    } finally {
      setLoading(false);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 text-white p-2 rounded-lg">
            <Coins size={24} />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">LendX</h1>
        </div>
        
        <div>
          {account ? (
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-slate-100 px-4 py-2 rounded-full text-sm font-medium text-slate-700 border border-slate-200">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                {formatAddress(account)}
              </div>
              <button 
                onClick={disconnectWallet}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                title="Disconnect"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Disconnect</span>
              </button>
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              disabled={loading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-full font-medium transition-colors disabled:opacity-70"
            >
              <Wallet size={18} />
              {loading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Status Banner */}
        {moralisStatus === false && (
          <div className="mb-8 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-amber-800">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold">Backend Configuration Required</h3>
              <p className="text-sm mt-1 opacity-90">
                The Moralis API key is not configured. Please set the <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs">MORALIS_API_KEY</code> environment variable in the AI Studio settings to fetch real blockchain data.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-red-800">
            <AlertCircle className="shrink-0 mt-0.5" size={20} />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Dashboard Panel */}
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Wallet className="text-slate-400" />
                  Wallet Overview
                </h2>
                {account && (
                  <button 
                    onClick={() => fetchPortfolio(account)}
                    disabled={loading}
                    className="flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-full"
                  >
                    <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh
                  </button>
                )}
              </div>
              
              {account ? (
                <div className="space-y-8">
                  <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                    <p className="text-sm font-medium text-slate-500 mb-1">Connected Address</p>
                    <p className="font-mono text-lg text-slate-800 break-all">{account}</p>
                  </div>
                  
                  {/* Native Balance */}
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-2">Ethereum Balance (Mainnet)</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold tracking-tight text-slate-900">
                        {balance !== null ? balance : '---'}
                      </span>
                      <span className="text-xl font-medium text-slate-500">ETH</span>
                    </div>
                  </div>

                  {/* Token Balances */}
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-lg font-medium text-slate-800 mb-4 flex items-center gap-2">
                      <List size={18} className="text-slate-400" />
                      ERC20 Tokens
                    </h3>
                    
                    {tokens.length > 0 ? (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                            <tr>
                              <th className="px-4 py-3 font-medium">Asset</th>
                              <th className="px-4 py-3 font-medium text-right">Balance</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {tokens.map((token, idx) => {
                              const tokenBalance = Number(token.balance) / Math.pow(10, token.decimals);
                              return (
                                <tr key={`${token.token_address}-${idx}`} className="hover:bg-slate-50">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      {token.thumbnail ? (
                                        <img src={token.thumbnail} alt={token.symbol} className="w-8 h-8 rounded-full border border-slate-200" />
                                      ) : (
                                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500">
                                          {token.symbol?.substring(0, 2) || '?'}
                                        </div>
                                      )}
                                      <div>
                                        <p className="font-medium text-slate-900">{token.name || 'Unknown Token'}</p>
                                        <p className="text-xs text-slate-500">{token.symbol}</p>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <p className="font-medium text-slate-900">
                                      {tokenBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                                    </p>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 text-center">
                        <p className="text-slate-500 text-sm">No ERC20 tokens found in this wallet on Ethereum Mainnet.</p>
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                <div className="text-center py-12 px-4">
                  <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet size={28} className="text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900 mb-2">No Wallet Connected</h3>
                  <p className="text-slate-500 max-w-md mx-auto mb-6">
                    Connect your MetaMask wallet to view your real Ethereum balance and token portfolio on the LendX dashboard.
                  </p>
                  <button 
                    onClick={connectWallet}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium transition-colors"
                  >
                    Connect MetaMask
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Info Panel */}
          <div className="space-y-6">
            <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-lg">
              <h3 className="text-lg font-semibold mb-4">About LendX</h3>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                LendX is a decentralized lending protocol. Currently in Phase 1, focusing on secure wallet connections and real-time blockchain data synchronization.
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">1</div>
                  <span className="text-slate-200">Wallet Connection</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">2</div>
                  <span className="text-slate-200">Real Data Fetching</span>
                </div>
                <div className="flex items-center gap-3 text-sm opacity-50">
                  <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">3</div>
                  <span>Lending Markets (Coming Soon)</span>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 uppercase tracking-wider">Network</h3>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span className="font-medium text-slate-700">Ethereum Mainnet</span>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Data provided by Moralis API
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


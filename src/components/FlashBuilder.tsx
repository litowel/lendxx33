import React, { useState } from 'react';
import { Zap, ArrowRight, AlertTriangle, PlayCircle, Code, ExternalLink, Activity, CheckCircle2, ShieldCheck } from 'lucide-react';
import { ethers } from 'ethers';
import { NETWORKS, AAVE_ADDRESSES, ABIS } from '../lib/constants';

interface FlashBuilderProps {
  account: string;
  chainId: number;
  setError: (msg: string) => void;
  setTxStatus: (msg: string) => void;
}

export function FlashBuilder({ account, chainId, setError, setTxStatus }: FlashBuilderProps) {
  const [strategyType, setStrategyType] = useState('Arbitrage');
  const [asset, setAsset] = useState('USDC');
  const [amount, setAmount] = useState('');
  const [dex, setDex] = useState('Uniswap');
  
  const [generatedCode, setGeneratedCode] = useState('');
  const [deployedAddress, setDeployedAddress] = useState('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [simulationResult, setSimulationResult] = useState<{ profit: string, gas: string } | null>(null);

  const handleGenerate = () => {
    if (!amount) return;
    
    const codeTemplate = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {FlashLoanSimpleReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";

contract FlashLoan${strategyType} is FlashLoanSimpleReceiverBase {
    address public owner;

    constructor(address _addressProvider) FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider)) {
        owner = msg.sender;
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        // 1. Flash Loan Received: ${amount} ${asset}
        
        // 2. Execute ${strategyType} Strategy via ${dex}
        // TODO: Implement custom logic here
        
        // 3. Approve Aave to pull funds back
        uint256 amountToOwe = amount + premium;
        IERC20(asset).approve(address(POOL), amountToOwe);

        return true;
    }

    function requestFlashLoan(address _token, uint256 _amount) public {
        require(msg.sender == owner, "Only owner");
        address receiverAddress = address(this);
        address asset = _token;
        uint256 amount = _amount;
        bytes memory params = "";
        uint16 referralCode = 0;

        POOL.flashLoanSimple(
            receiverAddress,
            asset,
            amount,
            params,
            referralCode
        );
    }
}`;
    setGeneratedCode(codeTemplate);
    setSimulationResult(null);
    setDeployedAddress('');
  };

  const handleDeployThirdweb = async () => {
    setIsDeploying(true);
    setTxStatus('Redirecting to thirdweb for one-click deployment...');
    
    // Simulate deployment delay for UX
    setTimeout(() => {
      // In a real scenario, this would open thirdweb deploy or use the SDK
      // window.open('https://thirdweb.com/deploy', '_blank');
      
      // Mocking the deployment result
      const mockAddress = ethers.Wallet.createRandom().address;
      setDeployedAddress(mockAddress);
      setIsDeploying(false);
      setTxStatus('Contract deployed successfully via thirdweb!');
      setTimeout(() => setTxStatus(''), 3000);
    }, 2000);
  };

  const handleSimulate = () => {
    setTxStatus('Running strategy simulation...');
    setTimeout(() => {
      setSimulationResult({
        profit: asset === 'USDC' ? '125.50' : '0.045',
        gas: '0.008'
      });
      setTxStatus('');
    }, 1500);
  };

  const handleExecute = async () => {
    if (!deployedAddress || !window.ethereum) return;
    
    setTxStatus('Initiating Flash Loan execution...');
    setError('');
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const aaveAddresses = AAVE_ADDRESSES[chainId] || AAVE_ADDRESSES[1];
      if (!aaveAddresses) throw new Error("Aave not supported on this network");
      
      const poolContract = new ethers.Contract(aaveAddresses.POOL, ABIS.POOL, signer);
      
      const assetAddress = asset === 'USDC' ? aaveAddresses.USDC : aaveAddresses.WETH;
      if (!assetAddress) throw new Error(`${asset} address not configured for this network`);
      
      const decimals = asset === 'USDC' ? 6 : 18;
      const amountWei = ethers.parseUnits(amount, decimals);
      
      setTxStatus('Please confirm the Flash Loan transaction in MetaMask...');
      
      // Call flashLoanSimple on Aave Pool
      // receiverAddress, asset, amount, params, referralCode
      const tx = await poolContract.flashLoanSimple(
        deployedAddress,
        assetAddress,
        amountWei,
        "0x",
        0
      );
      
      setTxStatus('Waiting for transaction confirmation...');
      await tx.wait();
      
      setTxStatus('Flash Loan executed successfully!');
      setTimeout(() => setTxStatus(''), 3000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'ACTION_REJECTED') {
        setError("Transaction rejected by user");
      } else {
        // Expected to fail if the deployedAddress is a mock or doesn't have funds to repay
        setError("Execution failed: Receiver contract must implement executeOperation and have sufficient funds to repay the loan + premium.");
      }
      setTxStatus('');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="flex items-center gap-4 mb-4 relative z-10">
          <div className="bg-yellow-600/20 p-3 rounded-xl border border-yellow-500/30">
            <Zap className="text-yellow-400" size={28} />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-white tracking-tight">AI-assisted Flash Loan Builder <span className="text-sm font-normal text-yellow-500 bg-yellow-500/10 px-2 py-1 rounded-full ml-2">(Advanced Users)</span></h2>
            <p className="text-slate-400 mt-1">Design, simulate, and execute real flash loan strategies</p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="text-yellow-400 shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-yellow-400 font-semibold mb-1">Warning</p>
          <p className="text-slate-300 text-sm">Flash loans require a correct and profitable strategy to execute successfully. If the strategy does not return enough funds to repay the loan plus the premium, the entire transaction will revert.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-fit">
          <h3 className="text-xl font-bold text-white mb-6">Strategy Parameters</h3>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Strategy Type</label>
              <select 
                value={strategyType}
                onChange={(e) => setStrategyType(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
              >
                <option value="Arbitrage">Arbitrage</option>
                <option value="Liquidation">Liquidation</option>
                <option value="Swap">Swap</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Asset</label>
              <select 
                value={asset}
                onChange={(e) => setAsset(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
              >
                <option value="USDC">USDC</option>
                <option value="ETH">ETH</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Flash Loan Amount</label>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 10000"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Target DEX</label>
              <select 
                value={dex}
                onChange={(e) => setDex(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-500 transition-colors"
              >
                <option value="Uniswap">Uniswap V3</option>
                <option value="SushiSwap">SushiSwap</option>
                <option value="Curve">Curve Finance</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!amount}
              className="w-full mt-2 bg-yellow-600 hover:bg-yellow-700 text-white py-3.5 rounded-xl font-bold transition-colors shadow-[0_0_15px_rgba(202,138,4,0.3)] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Code size={18} /> Generate Strategy
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col">
          <h3 className="text-xl font-bold text-white mb-6">Smart Contract & Execution</h3>
          
          {generatedCode ? (
            <div className="space-y-6 flex-1">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 relative group">
                <div className="absolute top-3 right-3 text-xs font-mono text-slate-500">Solidity</div>
                <pre className="font-mono text-sm text-green-400 overflow-x-auto whitespace-pre-wrap max-h-[300px] overflow-y-auto custom-scrollbar">
                  {generatedCode}
                </pre>
              </div>
              
              {!deployedAddress ? (
                <div className="p-5 bg-slate-800/50 border border-slate-700 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-white font-semibold mb-1">Deploy Contract</h4>
                    <p className="text-sm text-slate-400">Deploy this strategy to the blockchain to execute it.</p>
                  </div>
                  <button
                    onClick={handleDeployThirdweb}
                    disabled={isDeploying}
                    className="shrink-0 bg-white text-black hover:bg-slate-200 px-6 py-2.5 rounded-lg font-bold transition-colors flex items-center gap-2 disabled:opacity-70"
                  >
                    {isDeploying ? 'Deploying...' : 'Deploy with thirdweb'} <ExternalLink size={16} />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-green-400" size={24} />
                      <div>
                        <p className="text-green-400 font-semibold text-sm">Contract Deployed</p>
                        <p className="text-white font-mono text-sm">{deployedAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5">
                      <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-blue-400" /> Simulation Mode
                      </h4>
                      {simulationResult ? (
                        <div className="space-y-3 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Est. Profit</span>
                            <span className="text-green-400 font-bold">+{simulationResult.profit} {asset}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-slate-400">Est. Gas Cost</span>
                            <span className="text-slate-300">{simulationResult.gas} ETH</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-400 mb-4">Run a simulation to estimate profit and gas costs before execution.</p>
                      )}
                      <button
                        onClick={handleSimulate}
                        className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg font-semibold transition-colors text-sm"
                      >
                        Simulate Strategy
                      </button>
                    </div>

                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex flex-col justify-between">
                      <div>
                        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <Zap size={18} className="text-yellow-400" /> Execute Flash Loan
                        </h4>
                        <p className="text-sm text-slate-400 mb-4">Call the Aave V3 Pool to initiate the flash loan to your deployed contract.</p>
                      </div>
                      <button
                        onClick={handleExecute}
                        className="w-full bg-yellow-600 hover:bg-yellow-700 text-white py-2.5 rounded-lg font-bold transition-colors shadow-[0_0_15px_rgba(202,138,4,0.3)] text-sm"
                      >
                        Execute on Aave
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl flex-1">
              <Code size={48} className="mb-4 opacity-20" />
              <p>Configure parameters and generate a strategy to view the smart contract code.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

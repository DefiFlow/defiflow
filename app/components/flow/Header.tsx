// app/components/flow/Header.tsx
import React from 'react';
import { Wallet, Loader2, Play } from 'lucide-react';
import { useFlowStore } from '../../store/useFlowStore';
import { PriceTicker } from './PriceTicker';

export const Header = () => {
  const { 
    walletAddress, 
    setWalletAddress, 
    isRunning, 
    setIsRunning,
    nodes,
    edges 
  } = useFlowStore();

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const accounts = await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
      } catch (error) {
        console.error("Connection failed", error);
      }
    } else {
      alert("Please install MetaMask!");
    }
  };

  const handleStart = () => {
    if (!walletAddress) {
        alert("⚠️ Please connect your wallet first to execute on-chain transactions.");
        return;
    }

    // 1. 检查节点数量
    if (nodes.length < 2) {
        alert("⚠️ Agent Config Error: Please drag both a 'Trigger' and an 'Action' node.");
        return;
    }

    // 2. 检查连线 (是否存在 Trigger -> Action 的线)
    const hasConnection = edges.some(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        return sourceNode?.data.type === 'trigger' && targetNode?.data.type === 'action';
    });

    if (!hasConnection) {
        alert("⚠️ Logic Broken: Please connect the Price Trigger to the Uniswap Action.");
        return;
    }

    setIsRunning(true);
  };

  return (
    <div className="h-16 border-b bg-white flex items-center justify-between px-6 z-30 shadow-sm relative">
      <div className="flex items-center gap-6">
          <div className="font-bold text-xl flex items-center gap-2 tracking-tight text-stone-900">
              🤖 DefiFlow <span className="text-[10px] bg-stone-900 text-white px-1.5 py-0.5 rounded font-mono">BETA</span>
          </div>
          <PriceTicker />
      </div>
      
      <div className="flex items-center gap-4">
          <button
              onClick={connectWallet}
              className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all text-sm border
              ${walletAddress ? 'bg-green-50 text-green-700 border-green-200' : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-50'}`}
          >
              <Wallet className="w-4 h-4" />
              {walletAddress 
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                  : 'Connect Wallet'}
          </button>
          {isRunning && (
              <div className="flex items-center gap-2 text-xs text-blue-600 font-bold animate-pulse bg-blue-50 px-3 py-1 rounded-full">
                  <Loader2 className="animate-spin w-3 h-3"/> Monitoring Active...
              </div>
          )}
          <button 
              onClick={isRunning ? () => setIsRunning(false) : handleStart}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-white transition-all shadow-lg hover:shadow-xl active:scale-95 text-sm
              ${isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-stone-900 hover:bg-black'}`}
          >
              {isRunning ? 'Stop Agent' : 'Start Agent'}
              {!isRunning && <Play className="w-3 h-3 fill-current"/>}
          </button>
      </div>
    </div>
  );
};

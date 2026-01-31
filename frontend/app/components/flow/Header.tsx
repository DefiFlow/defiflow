// app/components/flow/Header.tsx
import React, { useEffect, useState } from 'react';
import { Wallet, Loader2, Play } from 'lucide-react';
import { useFlowStore } from '../../store/useFlowStore';
import { PriceTicker } from './PriceTicker';
import { ethers } from 'ethers';

export const Header = () => {
  const { 
    walletAddress, 
    setWalletAddress, 
    isRunning, 
    setIsRunning,
    nodes,
    edges,
    currentPrice // Assuming useFlowStore exposes this from PriceTicker updates
  } = useFlowStore();
  const [isExecuting, setIsExecuting] = useState(false);

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
        return (sourceNode?.data as any)?.type === 'trigger' && (targetNode?.data as any)?.type === 'action';
    });

    if (!hasConnection) {
        alert("⚠️ Logic Broken: Please connect the Price Trigger to the Uniswap Action.");
        return;
    }

    setIsRunning(true);
  };

  // Agent Execution Logic
  useEffect(() => {
    if (!isRunning || !currentPrice || !walletAddress || isExecuting) return;

    const executeLogic = async () => {
        // 1. Find Trigger Node
        const triggerNode = nodes.find(n => (n.data as any).type === 'trigger');
        const actionNode = nodes.find(n => (n.data as any).type === 'action');
        
        if (!triggerNode || !actionNode) return;

        const threshold = parseFloat((triggerNode.data as any).threshold);
        const operator = (triggerNode.data as any).operator;
        
        // 2. Check Condition
        let conditionMet = false;
        if (operator === '>' && currentPrice > threshold) conditionMet = true;
        if (operator === '<' && currentPrice < threshold) conditionMet = true;

        if (conditionMet) {
            console.log("⚡ Condition Met! Executing Agent...");
            setIsExecuting(true);
            setIsRunning(false); // Stop monitoring to prevent double execution

            try {
                // 3. Prepare Contract Call
                const provider = new ethers.BrowserProvider((window as any).ethereum);
                const signer = await provider.getSigner();
                
                // Replace with your deployed AgentExecutor address
                const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AGENT_ADDRESS || "";
                const WBTC_ADDRESS = process.env.NEXT_PUBLIC_TARGET_TOKEN_ADDRESS || "";
                
                const abi = [
                  "function executeSwapAndTransfer(address tokenOut, uint24 poolFee, address recipient, uint256 amountOutMinimum) external payable"
                ];
                
                const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

                // Parse Action Data
                const amountETH = (actionNode.data as any).amount || "0.0001";
                const recipient = (actionNode.data as any).recipient || walletAddress;
                
                // 4. Execute Transaction
                const tx = await contract.executeSwapAndTransfer(
                    WBTC_ADDRESS,
                    3000, // 0.3% fee tier
                    recipient,
                    0, // Slippage 0 for demo (calculate in prod)
                    { value: ethers.parseEther(amountETH) }
                );

                console.log("Transaction sent:", tx.hash);
                alert(`✅ Agent Executed! Transaction Hash: ${tx.hash}`);
                
            } catch (error) {
                console.error("Execution failed:", error);
                alert("❌ Execution Failed. Check console.");
                setIsRunning(false);
            } finally {
                setIsExecuting(false);
            }
        }
    };

    executeLogic();

  }, [currentPrice, isRunning, nodes, walletAddress]);

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
          {(isRunning || isExecuting) && (
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

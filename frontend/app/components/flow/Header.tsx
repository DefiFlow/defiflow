// app/components/flow/Header.tsx
import React, { useEffect, useState } from 'react';
import { Wallet, Loader2, Play } from 'lucide-react';
import { useFlowStore } from '../../store/useFlowStore';
import { PriceTicker } from './PriceTicker';
import { ethers } from 'ethers';
import AgentExecutorData from '../../constants/AgentExecutor.json';

export const Header = () => {
  const {
    walletAddress,
    setWalletAddress,
    isRunning,
    setIsRunning,
    nodes,
    edges,
    currentPrice,
    setTxHash,
    setShowSuccessModal
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

    const lifiNode = nodes.find(n => (n.data as any)?.type === 'lifi'); // Changed from 'trigger' to 'lifi'
    const actionNode = nodes.find(n => (n.data as any)?.type === 'action');
    const transferNode = nodes.find(n => (n.data as any)?.type === 'transfer');

    if (!lifiNode || !lifiNode.data || !actionNode || !actionNode.data || !transferNode || !transferNode.data) {
      alert("⚠️ Flow is incomplete. A LI.FI Bridge, action, and Arc Payroll node are all required."); // Updated message
      return;
    }

    const hasConnectionToAction = edges.some(edge => edge.source === lifiNode.id && edge.target === actionNode.id); // Updated to lifiNode
    const hasConnectionToTransfer = edges.some(edge => edge.source === actionNode.id && edge.target === transferNode.id);

    if (!hasConnectionToAction || !hasConnectionToTransfer) {
      alert("⚠️ Logic Broken: Please connect the nodes in the correct order: Trigger -> Action -> Transfer.");
      return;
    }

    setIsRunning(true);
  };

  // Agent Execution Logic
  useEffect(() => {
    if (!isRunning || !currentPrice || !walletAddress || isExecuting) return;

    const isValidAddress = (addr: string): addr is `0x${string}` => {
      return /^0x[a-fA-F0-9]{40}$/.test(addr);
    };

    const executeLogic = async () => {
      const lifiNode = nodes.find(n => (n.data as any)?.type === 'lifi'); // Changed from 'trigger' to 'lifi'
      const actionNode = nodes.find(n => (n.data as any)?.type === 'action');
      const transferNode = nodes.find(n => (n.data as any)?.type === 'transfer');

      if (!lifiNode || !lifiNode.data || !actionNode || !actionNode.data || !transferNode || !transferNode.data) {
        setIsRunning(false); // Stop monitoring if flow is incomplete
        // This alert is likely redundant due to handleStart, but good for safety.
        alert("⚠️ Flow is incomplete. A LI.FI Bridge, action, and Arc Payroll node are all required."); // Updated message
        return;
      }
      console.log("⚡ Executing Agent (LI.FI Bridge)..."); // Updated message
      setIsExecuting(true);
      setIsRunning(false); // Stop monitoring once execution starts

      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();

        const AGENT_EXECUTOR_ADDRESS = AgentExecutorData.address;
        if (!AGENT_EXECUTOR_ADDRESS || !isValidAddress(AGENT_EXECUTOR_ADDRESS)) {
          throw new Error("Contract address is not configured or invalid in AgentExecutor.json");
        }

        const finalRecipient = (transferNode.data as any).recipient;
        if (!finalRecipient || !isValidAddress(finalRecipient)) {
          throw new Error("Recipient address is not set or invalid in the transfer node.");
        }

        // Extract LI.FI specific data
        const lifiFromChain = (lifiNode.data as any).fromChain;
        const lifiToChain = (lifiNode.data as any).toChain;
        const lifiFromToken = (lifiNode.data as any).fromToken;
        const lifiToToken = (lifiNode.data as any).toToken;
        const lifiContractTarget = (lifiNode.data as any).contractCall?.target;
        const lifiContractData = (lifiNode.data as any).contractCall?.data;

        if (!lifiFromChain || !lifiToChain || !lifiFromToken || !lifiToToken || !lifiContractTarget || !lifiContractData) {
          throw new Error("LI.FI Bridge node configuration is incomplete.");
        }
        if (!isValidAddress(lifiContractTarget)) {
          throw new Error("LI.FI Bridge contract target address is invalid.");
        }

        const amountStr = String((actionNode.data as any).amount || "0.0001");
        const amountIn = ethers.parseEther(amountStr); // Assuming ETH for value transfer

        console.log("Simulating LI.FI cross-chain call with parameters:");
        console.log("  From Chain:", lifiFromChain);
        console.log("  To Chain:", lifiToChain);
        console.log("  From Token:", lifiFromToken);
        console.log("  To Token:", lifiToToken);
        console.log("  Contract Target:", lifiContractTarget);
        console.log("  Contract Data:", lifiContractData);
        console.log("  Amount (ETH for value):", amountIn.toString());
        console.log("  Final Recipient:", finalRecipient);

        // Mocking a transaction using the new LI.FI data
        // In a real scenario, you would call a function on your AgentExecutor contract
        // that orchestrates the LI.FI bridge and then the contract call.
        // Example: `const tx = await contract.executeLifiBridgeAndCall(lifiFromChain, lifiToChain, lifiFromToken, lifiToToken, lifiContractTarget, lifiContractData, finalRecipient, { value: amountIn });`
        // Since the AgentExecutor ABI for such a function is not available, we simulate it.
        const tx = await new Promise((resolve) => {
          setTimeout(() => {
            console.log("Mock LI.FI Bridge transaction successful!");
            resolve({ hash: `0xmockTxHash_${Date.now()}` });
          }, 3000); // Simulate network delay
        });

        console.log("Transaction sent:", (tx as any).hash);
        setTxHash((tx as any).hash);
        setShowSuccessModal(true);

      } catch (error: any) {
        console.error("Execution failed:", error);
        alert(`❌ Execution Failed: ${error.message}`);
      } finally {
        setIsExecuting(false);
        setIsRunning(false);
      }
    };

    // The executeLogic should run when isRunning becomes true and not already executing.
    // The currentPrice dependency is removed as it's no longer a trigger for the LI.FI node.
    if (isRunning && !isExecuting) {
      executeLogic();
    }
  }, [isRunning, nodes, walletAddress, isExecuting, setTxHash, setShowSuccessModal]); // Removed currentPrice from dependencies

  return (
    <div className="h-16 border-b border-[#2A2B32] bg-[#121314] flex items-center justify-between px-6 z-30 shadow-sm relative">
      <div className="flex items-center gap-6">
        <div className="font-black text-base flex items-center gap-2 tracking-normal text-white" style={{ fontFamily: 'Inter', fontStyle: 'italic', lineHeight: '100%', fontWeight: 900 }}>
          🤖 DefiFlow
        </div>
        <PriceTicker />
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={connectWallet}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all text-sm border
              ${walletAddress ? 'bg-green-50 text-green-700 border-green-200' : 'bg-black text-white border-[#2A2B32] hover:bg-[#1A1D24]'}`}
        >
          <Wallet className="w-4 h-4" />
          {walletAddress
            ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
            : 'Connect Wallet'}
        </button>
        {(isRunning || isExecuting) && (
          <div className="flex items-center gap-2 text-xs text-blue-400 font-bold animate-pulse bg-blue-950/30 px-3 py-1 rounded-full border border-blue-500/30">
            <Loader2 className="animate-spin w-3 h-3" /> Monitoring Active...
          </div>
        )}
        <button
          onClick={isRunning ? () => setIsRunning(false) : handleStart}
          className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold text-white transition-all shadow-lg hover:shadow-xl active:scale-95 text-sm
              ${isRunning ? 'bg-red-500 hover:bg-red-600' : ''}`}
          style={!isRunning ? { background: 'linear-gradient(95.41deg, #00BC99 0%, #435CFF 101.29%)' } : {}}
        >
          {isRunning ? 'Stop Agent' : 'Start Agent'}
          {!isRunning && <Play className="w-3 h-3 fill-current" />}
        </button>
      </div>
    </div>
  );
};

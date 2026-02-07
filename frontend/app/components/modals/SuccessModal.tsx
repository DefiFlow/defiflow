// app/components/modals/SuccessModal.tsx
import React from 'react';
import { X, CheckCircle2, Loader2, Circle, AlertTriangle, ChevronRight } from 'lucide-react';
import { useFlowStore } from '../../store/useFlowStore';

const executionSteps = [
    "Initializing Agent",
    "Swapping Tokens on Sepolia",
    "Settling Payroll on Arc",
    "Execution Complete"
];

export const SuccessModal = () => {
    const {
        showSuccessModal,
        setShowSuccessModal,
        nodes,
        isRunning,
        executionStep,
        executionError,
        swapHash,
        arcHash
    } = useFlowStore();

    const onClose = () => setShowSuccessModal(false);

    // Extract details from the nodes
    const actionNode = nodes.find(n => (n.data as any)?.type === 'action');
    // The amount swapped is the ETH amount, which is in the output field of the action node.
    // The input field contains the target USDC amount.
    const amount = actionNode?.data?.output?.replace(/[^0-9.]/g, '') || '0';
    const fromToken = 'mETH';

    const ensNodes = nodes.filter(n => n.type === 'ens' || n.data?.type === 'ens');
    const recipientsCount = ensNodes.reduce((acc, node) => acc + (Array.isArray(node.data.recipients) ? node.data.recipients.length : 0), 0);

    const isComplete = !isRunning && (!!swapHash || !!arcHash) && !executionError;

    if (!showSuccessModal) {
        return null;
    }

    const openExplorer = (type: 'sepolia' | 'arc', hash: string | null) => {
        if (!hash) return;
        const baseUrl = type === 'sepolia'
            ? 'https://sepolia.etherscan.io/tx/'
            : 'https://testnet.arcscan.app/tx/';
        window.open(`${baseUrl}${hash}`, '_blank');
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[100] animate-in fade-in duration-200">
            <div className="bg-[#121314] border border-[#2A2B32] p-8 rounded-[32px] shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-300 relative">

                <button onClick={onClose} className="absolute top-6 right-6 text-stone-500 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                {/* Header: Changes based on state (executing, success, error) */}
                <div className="flex flex-col items-center mb-8">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-6
                        ${isComplete ? 'bg-[#00E676] shadow-[0_0_20px_rgba(0,230,118,0.3)]' :
                            executionError ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.3)]' :
                                'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]'}`
                    }>
                        {isComplete ? <CheckCircle2 className="w-7 h-7 text-white fill-[#00E676] stroke-white" /> :
                            executionError ? <AlertTriangle className="w-7 h-7 text-white" /> :
                                <Loader2 className="w-7 h-7 text-white animate-spin" />}
                    </div>
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                        {isComplete ? 'Transfer Initiated' : executionError ? 'Execution Failed' : 'Agent Executing'}
                    </h2>
                    <p className="text-sm text-stone-400 mt-1 text-center font-medium leading-relaxed">
                        {isComplete ? 'Transaction submitted to Sepolia' : executionError ? executionError : 'Please wait and confirm transactions in your wallet.'}
                    </p>
                </div>

                {/* Summary Card (Success Only) */}
                {isComplete && (
                    <div className="bg-[#08090A] rounded-[24px] border border-[#2A2B32] overflow-hidden mb-6 animate-in fade-in duration-500">
                        <div className="p-1">
                            {/* Amount Swapped Row */}
                            <button
                                onClick={() => openExplorer('sepolia', swapHash)}
                                className="w-full flex justify-between items-center p-4 hover:bg-white/5 transition-colors group"
                            >
                                <span className="text-stone-500 text-[10px] uppercase font-bold tracking-[0.15em]">Amount Swapped</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm">{amount} {fromToken}</span>
                                    <ChevronRight className="w-4 h-4 text-stone-600 group-hover:text-stone-400 transition-colors" />
                                </div>
                            </button>

                            <div className="mx-4 border-b border-[#1A1D24]"></div>

                            {/* Single Arc Row */}
                            <button
                                onClick={() => openExplorer('arc', arcHash)}
                                className="w-full flex justify-between items-center p-4 hover:bg-white/5 transition-colors group"
                            >
                                <span className="text-stone-500 text-[10px] uppercase font-bold tracking-[0.15em]">Final Network</span>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-white text-sm whitespace-nowrap">Arc Testnet</span>
                                    <ChevronRight className="w-4 h-4 text-stone-600 group-hover:text-stone-400 transition-colors" />
                                </div>
                            </button>
                        </div>
                    </div>
                )}

                {/* Steps List (Loading Only) */}
                {!isComplete && !executionError && (
                    <div className="space-y-4 mb-10 ml-1">
                        {executionSteps.map((step, index) => (
                            <div key={index} className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-500" style={{ animationDelay: `${index * 100}ms` }}>
                                <div className={`flex items-center justify-center w-5 h-5 rounded-full transition-colors duration-300
                                    ${index < (executionStep || 0) ? 'bg-green-500 text-white' :
                                        index === (executionStep || 0) ? 'bg-blue-500 text-white' :
                                            'bg-stone-700 text-stone-400'
                                    }`
                                }>
                                    {index < (executionStep || 0) ? <CheckCircle2 className="w-3.5 h-3.5" /> :
                                        index === (executionStep || 0) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
                                            <Circle className="w-3.5 h-3.5" />}
                                </div>
                                <span className={`text-sm font-bold transition-colors duration-300
                                    ${index <= (executionStep || 0) ? 'text-white' : 'text-stone-500'}`
                                }>
                                    {step}
                                </span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Reference Hash */}
                {(swapHash || arcHash) && (
                    <div className="text-center mt-2">
                        <p className="text-[10px] text-stone-600 font-mono tracking-tight">
                            Ref {`${(swapHash || arcHash || '').slice(0, 10)}...${(swapHash || arcHash || '').slice(-8)}`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

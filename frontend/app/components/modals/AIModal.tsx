// app/components/modals/AIModal.tsx
import React, { useState } from 'react';
import { X, Sparkles, Check, Circle, Loader2, BrainCircuit } from 'lucide-react';
import { MarkerType, useReactFlow } from '@xyflow/react';
import { useFlowStore } from '../../store/useFlowStore';
import { analyzeIntent } from '../../actions';

export const AIModal = () => {
    const { setShowAIModal, setNodes, setEdges, currentPrice } = useFlowStore();
    const { fitView } = useReactFlow();
    const onClose = () => setShowAIModal(false);

    const [intent, setIntent] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [step, setStep] = useState(0);
    const [thoughtText, setThoughtText] = useState("");

    const steps = [
        "Analyzing user intent...",
        "Extracting DeFi parameters...",
        "Checking market conditions...",
        "Constructing workflow..."
    ];

    const handleAnalyze = async () => {
        if (!intent.trim()) return;
        setIsProcessing(true);
        setStep(0);
        setThoughtText("");

        try {
            // --- MOCK DATA FOR DEBUGGING ---
            /*
            const mockResult = {
                thought: "I've processed your request. I will initiate a swap for the specified assets on Uniswap, then resolve the ENS name 'vitalik.eth' to get the target address, and finally set up the payroll distribution on the Arc Testnet as requested.",
                error: null,
                nodes: [
                    { id: 'node-1', type: 'custom', position: { x: 100, y: 100 }, data: { type: 'action', label: 'Uniswap Swap', input: '1' } },
                    { id: 'node-2', type: 'custom', position: { x: 100, y: 350 }, data: { type: 'ens', label: 'ENS Resolver', recipients: [{ address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', amount: 10, input: 'vitalik.eth' }] } },
                    { id: 'node-3', type: 'custom', position: { x: 100, y: 600 }, data: { type: 'transfer', label: 'Arc Payroll', memo: 'Debug Mock Reward' } },
                ],
                edges: [
                    { id: 'e1-2', source: 'node-1', target: 'node-2', animated: true },
                    { id: 'e2-3', source: 'node-2', target: 'node-3', animated: true },
                ]
            };
            */

            // Simulation delay to see UI animations
            // await new Promise(r => setTimeout(r, 800));
            // const result = mockResult; 
            const result = await analyzeIntent(intent, currentPrice);
            // ------------------------------

            if (result && !result.error) {
                // Typwriter Effect for AI Thoughts
                const rawThoughts = result.thought || "Processing request...";
                setThoughtText("");

                let currentText = "";
                for (let i = 0; i < rawThoughts.length; i++) {
                    currentText += rawThoughts[i];
                    setThoughtText(currentText);
                    await new Promise(r => setTimeout(r, 20)); // Adjust speed (20ms per char)
                }

                await new Promise(r => setTimeout(r, 1500));

                // Proceed to next steps
                setStep(1);
                await new Promise(r => setTimeout(r, 800));
                setStep(2);
                await new Promise(r => setTimeout(r, 800));
                setStep(3);
                await new Promise(r => setTimeout(r, 800));

                // Finish - Call the callback passed via props or store
                updateFlowFromAI(result);
                onClose();
            } else {
                alert("Failed to parse intent. Please try again.");
                setIsProcessing(false);
            }
        } catch (e) {
            console.error(e);
            alert("Error connecting to AI.");
            setIsProcessing(false);
        }
    };

    const updateFlowFromAI = (result: any) => {
        if (result.nodes && result.edges) {
            const formattedNodes = result.nodes.map((node: any) => ({
                ...node,
                type: 'custom'
            }));

            // 1. Set edges first
            // When nodes mount, they will immediately sense these edges and 
            // render their final (expanded) height from the very first frame.
            setEdges(result.edges);

            // 2. Set nodes in the next tick to ensure edges are in the store
            setTimeout(() => {
                setNodes(formattedNodes);
            }, 0);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
            <div
                className="rounded-xl p-6 shadow-2xl max-w-md w-full relative animate-in zoom-in-95 duration-300"
                style={{ background: 'linear-gradient(90deg, #5F2AFF 0%, #B800D8 100%)' }}
            >
                <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white">
                    <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-3 mb-4">
                    <div className="overflow-hidden flex items-center justify-center">
                        <img src="/AIB.png" alt="AI Builder" className="w-7 h-7 object-contain" />
                    </div>
                    <h2 className="text-xl font-bold text-white">AI Agent Builder</h2>
                </div>

                {isProcessing ? (
                    <div className="py-6 px-2 flex flex-col gap-4">
                        {steps.map((s, i) => (
                            <div key={i} className="flex flex-col gap-1">
                                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-500">
                                    <div className={`rounded-full transition-colors duration-300 ${i < step ? 'p-0' :
                                        i === step ? 'bg-white/30 text-white p-1' :
                                            'bg-white/10 text-white/40 p-1'
                                        }`}>
                                        {i < step ? <img src="/success_icon.png" alt="Done" className="w-5 h-5 object-contain" /> :
                                            i === step ? <Loader2 className="w-4 h-4 animate-spin" /> :
                                                <Circle className="w-4 h-4" />}
                                    </div>
                                    <span className={`text-sm transition-colors duration-300 ${i <= step ? 'text-white font-medium' : 'text-white/50'
                                        }`}>{s}</span>
                                </div>
                                {/* Typwriter Thought Display (Step 0) */}
                                {i === 0 && step === 0 && (
                                    <div className="ml-9 p-4 bg-[#00000033] rounded-xl border border-white/10 min-h-[80px] relative overflow-hidden mt-1 shadow-inner">
                                        <div className="text-[11px] font-mono leading-relaxed">
                                            <span className="text-purple-400 font-bold mr-2">AI :</span>
                                            <span className="text-white/90">
                                                {thoughtText}
                                            </span>
                                        </div>
                                        {/* Gemini-style shimmering loading bar */}
                                        <div className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-purple-300 to-transparent opacity-30 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        <p className="text-white/90 mb-4 text-sm">
                            Describe what you want to do, and I'll build the workflow for you.
                        </p>
                        <textarea
                            className="w-full border border-white/20 rounded-lg p-3 text-sm focus:outline-none focus:border-white/40 min-h-[100px] mb-4 resize-none text-white placeholder-white/50"
                            style={{ backgroundColor: '#00000033' }}
                            placeholder="e.g. Swap 1 ETH to USDC, resolve vitalik.eth, and pay salary on Arc..."
                            value={intent}
                            onChange={(e) => setIntent(e.target.value)}
                            disabled={isProcessing}
                        />
                        <button
                            onClick={handleAnalyze}
                            disabled={isProcessing || !intent.trim()}
                            className="w-full py-2.5 rounded-lg font-bold transition shadow-lg text-sm flex items-center justify-center gap-2 disabled:cursor-not-allowed text-purple-600"
                            style={{
                                backgroundColor: '#FFFFFF',
                                opacity: intent.trim() ? 1 : 0.5
                            }}
                        >
                            Generate Workflow
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

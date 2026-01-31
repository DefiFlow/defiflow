"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge as FlowEdge,
  Node as FlowNode,
  Handle,
  Position,
  ReactFlowProvider,
  useReactFlow,
  MarkerType, // 引入箭头样式
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Play, Loader2, GripVertical, X, MousePointer2, Zap, Repeat, ArrowRight, Activity, BrainCircuit, Sparkles, Check, Circle, MessageSquareQuote } from 'lucide-react';
import { analyzeIntent } from '../actions';

// ==========================================
// 1. 顶部行情组件 (Binance WebSocket)
// ==========================================
const PriceTicker = ({ onPriceUpdate }: { onPriceUpdate: (price: number) => void }) => {
  const [price, setPrice] = useState<string>("0.00");
  const [trend, setTrend] = useState<'up' | 'down'>('up');

  useEffect(() => {
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@trade');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data as string);
      const current = parseFloat(data.p);
      setPrice((prev) => {
        const prevPrice = parseFloat(prev);
        setTrend(current > prevPrice ? 'up' : 'down');
        return current.toFixed(2);
      });
      onPriceUpdate(current);
    };
    return () => ws.close();
  }, [onPriceUpdate]);

  return (
    <div className="flex items-center gap-3 bg-stone-900 text-white px-4 py-1.5 rounded-full border border-stone-700 shadow-inner">
      <div className="flex items-center gap-2 border-r border-stone-700 pr-3">
        <Activity className={`w-4 h-4 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
        <span className="font-bold text-xs text-stone-400">ETH/USDT</span>
      </div>
      <span className={`font-mono text-lg font-bold ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
        ${price}
      </span>
    </div>
  );
};

// ==========================================
// 2. 左侧拖拽侧边栏
// ==========================================
const Sidebar = ({ onAIClick }: { onAIClick: () => void }) => {
  const onDragStart = (event: React.DragEvent<HTMLDivElement>, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <aside className="w-64 bg-white border-r border-stone-200 p-4 flex flex-col gap-4 z-20 shadow-sm">
      <div className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Components Library</div>
      
      {/* AI Agent Card */}
      <div 
        onClick={onAIClick}
        className="p-3 border border-purple-200 rounded-lg cursor-pointer flex items-center gap-3 hover:border-purple-500 hover:bg-purple-50 transition-all bg-white group mb-2"
      >
        <div className="bg-purple-100 p-2 rounded-md text-purple-600 group-hover:bg-purple-200 transition-colors">
            <BrainCircuit className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm text-stone-700">AI Agent</span>
          <span className="text-[10px] text-stone-400">Generate flow from text</span>
        </div>
      </div>
      
      {/* Trigger 组件 */}
      <div 
        className="p-3 border border-stone-200 rounded-lg cursor-grab flex items-center gap-3 hover:border-blue-500 hover:bg-blue-50 transition-all bg-white select-none active:cursor-grabbing group"
        onDragStart={(event) => onDragStart(event, 'trigger', 'Price Monitor')} 
        draggable
      >
        <div className="bg-blue-100 p-2 rounded-md text-blue-600 group-hover:bg-blue-200 transition-colors">
            <Zap className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm text-stone-700">Price Trigger</span>
          <span className="text-[10px] text-stone-400">Monitors ETH price</span>
        </div>
      </div>

      {/* Action 组件 */}
      <div 
        className="p-3 border border-stone-200 rounded-lg cursor-grab flex items-center gap-3 hover:border-pink-500 hover:bg-pink-50 transition-all bg-white select-none active:cursor-grabbing group"
        onDragStart={(event) => onDragStart(event, 'action', 'Uniswap Swap')} 
        draggable
      >
        <div className="bg-pink-100 p-2 rounded-md text-pink-600 group-hover:bg-pink-200 transition-colors">
            <Repeat className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm text-stone-700">Uniswap Action</span>
          <span className="text-[10px] text-stone-400">Executes token swap</span>
        </div>
      </div>
      
      <div className="mt-auto p-4 bg-stone-50 rounded-lg text-xs text-stone-500 border border-stone-100">
        <p className="font-bold mb-1 flex items-center gap-1">💡 Pro Tip:</p>
        Drag and drop components to the canvas, then connect them to build logic.
      </div>
    </aside>
  );
};

// ==========================================
// 3. 自定义节点 (带输入框)
// ==========================================
const CustomNode = ({ id, data }: { id: string, data: any }) => {
  const { updateNodeData } = useReactFlow();

  const handleChange = (field: string, value: string) => {
    updateNodeData(id, { ...data, [field]: value });
  };

  return (
    <div className={`px-4 py-3 shadow-xl rounded-xl border min-w-[240px] transition-all duration-300
        ${data.active ? 'border-green-400 ring-2 ring-green-500/20 bg-stone-800' : 'bg-stone-900 border-stone-700 hover:border-stone-500'}
    `}>
      {/* 顶部 Handle (只有 Action 有) */}
      {data.type === 'action' && (
         <Handle type="target" position={Position.Top} className="!bg-blue-500 !w-3 !h-3 !-top-1.5" />
      )}
      
      {/* 标题栏 */}
      <div className="flex items-center gap-2 mb-3 border-b border-stone-700 pb-2">
        {data.type === 'trigger' ? <Zap className="w-4 h-4 text-yellow-400" /> : <Repeat className="w-4 h-4 text-pink-400" />}
        <span className="font-bold text-sm text-stone-200">{data.label}</span>
      </div>

      {/* 内容区域 */}
      {data.type === 'trigger' ? (
        <div className="flex flex-col gap-2">
           <div className="flex gap-2 items-center">
             <span className="text-[10px] text-stone-400 font-mono">ETH</span>
             <select 
               className="nodrag bg-stone-800 text-xs text-white border border-stone-600 rounded px-1 py-1.5 focus:outline-none focus:border-blue-500"
               onChange={(e) => handleChange('operator', e.target.value)}
               defaultValue={data.operator || ">"}
             >
               <option value=">">&gt;</option>
               <option value="<">&lt;</option>
             </select>
             <div className="relative flex-1">
                <span className="absolute left-2 top-1.5 text-stone-500 text-xs">$</span>
                <input 
                    type="number"
                    className="nodrag w-full bg-stone-800 border border-stone-600 rounded pl-4 pr-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="3000"
                    defaultValue={data.threshold || ""}
                    onChange={(e) => handleChange('threshold', e.target.value)}
                />
             </div>
           </div>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
           <div className="flex gap-2 items-center">
             <select 
               className="nodrag bg-stone-800 text-xs text-white border border-stone-600 rounded px-1 py-1 focus:outline-none focus:border-blue-500"
               value={data.fromToken || "ETH"}
               onChange={(e) => handleChange('fromToken', e.target.value)}
             >
               <option value="ETH">ETH</option>
               <option value="BTC">BTC</option>
             </select>
             <ArrowRight className="w-3 h-3 text-stone-500" />
             <select 
               className="nodrag bg-stone-800 text-xs text-white border border-stone-600 rounded px-1 py-1 focus:outline-none focus:border-blue-500"
               value={data.toToken || "BTC"}
               onChange={(e) => handleChange('toToken', e.target.value)}
             >
               <option value="ETH">ETH</option>
               <option value="BTC">BTC</option>
             </select>
           </div>
           
           <div className="flex gap-2 items-center">
             <select 
               className="nodrag bg-stone-800 text-xs text-white border border-stone-600 rounded px-1 py-1 focus:outline-none focus:border-blue-500 w-16"
               value={data.amountType || "percentage"}
               onChange={(e) => handleChange('amountType', e.target.value)}
             >
               <option value="percentage">%</option>
               <option value="absolute">Amt</option>
             </select>
             <input 
                type="number"
                className="nodrag flex-1 bg-stone-800 border border-stone-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                placeholder="Amount"
                value={data.amount || ""}
                onChange={(e) => handleChange('amount', e.target.value)}
             />
           </div>
        </div>
      )}

      {/* 底部 Handle (只有 Trigger 有) */}
      {data.type === 'trigger' && (
        <Handle type="source" position={Position.Bottom} className="!bg-blue-500 !w-3 !h-3 !-bottom-1.5" />
      )}
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

// ==========================================
// 4. 成功弹窗
// ==========================================
const SuccessModal = ({ onClose }: { onClose: () => void }) => (
  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
    <div className="bg-white rounded-xl p-6 shadow-2xl max-w-md w-full border-l-4 border-green-500 relative animate-in zoom-in-95 duration-300">
      <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-black">
        <X className="w-5 h-5" />
      </button>
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-green-100 p-2 rounded-full relative">
            <div className="bg-green-500 w-3 h-3 rounded-full animate-ping absolute top-2 left-2" />
            <div className="bg-green-500 w-3 h-3 rounded-full relative" />
        </div>
        <h2 className="text-xl font-bold text-stone-800">Agent Execution Triggered!</h2>
      </div>
      <p className="text-stone-600 mb-4 text-sm">
        Price condition met. The agent has successfully executed the batch transaction via Uniswap Universal Router.
      </p>
      <div className="bg-stone-50 p-3 rounded border border-stone-200 font-mono text-[10px] text-stone-500 break-all mb-4 flex flex-col gap-1">
        <div className="flex items-center justify-between">
            <span className="font-bold text-stone-700">STATUS</span>
            <span className="bg-green-200 text-green-800 px-1.5 rounded text-[9px] font-bold">CONFIRMED</span>
        </div>
        <div>Tx: 0x71c35617a2336319856306540c4391605634...</div>
      </div>
      <button onClick={onClose} className="w-full bg-stone-900 text-white py-2.5 rounded-lg font-bold hover:bg-black transition shadow-lg text-sm">
        View Transaction on Etherscan
      </button>
    </div>
  </div>
);

// ==========================================
// 4.5 AI 输入弹窗
// ==========================================
const AIModal = ({ onClose, onConfirm }: { onClose: () => void, onConfirm: (data: any) => void }) => {
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
        const result = await analyzeIntent(intent);
        
        if (result && !result.error) {
            // Typewriter effect for thoughts (Step 0)
            const rawThoughts = result.thought || "Processing request...";
            const sentences = rawThoughts.match(/[^.!?]+[.!?]+/g) || [rawThoughts];
            
            for (const sentence of sentences) {
                const text = sentence.trim();
                if (!text) continue;

                // Type in
                for (let i = 0; i <= text.length; i++) {
                    setThoughtText(text.slice(0, i));
                    await new Promise(r => setTimeout(r, 30)); 
                }
                await new Promise(r => setTimeout(r, 1000)); // Read delay

                // Delete out
                for (let i = text.length; i >= 0; i--) {
                    setThoughtText(text.slice(0, i));
                    await new Promise(r => setTimeout(r, 10));
                }
            }

            // Proceed to next steps
            setStep(1);
            await new Promise(r => setTimeout(r, 800));
            setStep(2);
            await new Promise(r => setTimeout(r, 800));
            setStep(3);
            await new Promise(r => setTimeout(r, 800));

            // Finish
            onConfirm(result);
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

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl p-6 shadow-2xl max-w-md w-full relative animate-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-4 right-4 text-stone-400 hover:text-black">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="bg-purple-100 p-2 rounded-full">
              <Sparkles className="w-5 h-5 text-purple-600" />
          </div>
          <h2 className="text-xl font-bold text-stone-800">AI Agent Builder</h2>
        </div>
        
        {isProcessing ? (
            <div className="py-6 px-2 flex flex-col gap-4">
                {steps.map((s, i) => (
                    <div key={i} className="flex flex-col gap-1">
                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-500">
                            <div className={`p-1 rounded-full transition-colors duration-300 ${
                                i < step ? 'bg-green-100 text-green-600' : 
                                i === step ? 'bg-purple-100 text-purple-600' : 
                                'bg-stone-100 text-stone-300'
                            }`}>
                                {i < step ? <Check className="w-4 h-4" /> : 
                                 i === step ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                                 <Circle className="w-4 h-4" />}
                            </div>
                            <span className={`text-sm transition-colors duration-300 ${
                                i <= step ? 'text-stone-800 font-medium' : 'text-stone-400'
                            }`}>{s}</span>
                        </div>
                        {/* Typewriter area for Step 0 */}
                        {i === 0 && step === 0 && (
                            <div className="ml-9 min-h-[3rem] text-xs text-stone-500 font-mono leading-relaxed relative">
                                <span className="text-purple-600 mr-1 font-bold">AI:</span>
                                {thoughtText}
                                <span className="animate-pulse inline-block w-1.5 h-3 bg-purple-400 ml-1 align-middle"></span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        ) : (
            <>
                <p className="text-stone-600 mb-4 text-sm">
                  Describe what you want to do, and I'll build the workflow for you.
                </p>
                <textarea
                    className="w-full bg-stone-50 border border-stone-200 rounded-lg p-3 text-sm focus:outline-none focus:border-purple-500 min-h-[100px] mb-4 resize-none"
                    placeholder="e.g. If ETH price goes above 3500, swap all ETH to USDC..."
                    value={intent}
                    onChange={(e) => setIntent(e.target.value)}
                    disabled={isProcessing}
                />
                <button
                    onClick={handleAnalyze}
                    disabled={isProcessing || !intent.trim()}
                    className="w-full bg-purple-600 text-white py-2.5 rounded-lg font-bold hover:bg-purple-700 transition shadow-lg text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BrainCircuit className="w-4 h-4" />
                  Generate Workflow
                </button>
            </>
        )}
      </div>
    </div>
  );
};

// ==========================================
// 5. 主逻辑区域 (FlowArea)
// ==========================================
const FlowArea = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, fitView } = useReactFlow();
  
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);

  // --- 连线逻辑 (带箭头) ---
  const onConnect = useCallback((params: Connection) => {
    const newEdge = {
      id: `${params.source}-${params.target}`,
        ...params,
        animated: true,
        style: { stroke: '#3b82f6', strokeWidth: 2 },
        markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
    } as FlowEdge;
    setEdges((eds) => addEdge(newEdge, eds));
  }, [setEdges]);

  // --- 拖拽放置逻辑 ---
  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      const label = event.dataTransfer.getData('application/label');

      if (!type) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      
      const newNode: FlowNode = {
        id: `${type}-${Date.now()}`,
        type: 'custom',
        position,
        data: { 
            label, 
            type, 
            operator: '>', 
            threshold: '',
            fromToken: 'ETH',
            toToken: 'BTC',
            amountType: 'percentage',
            amount: ''
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [screenToFlowPosition, setNodes],
  );

  // --- AI 生成逻辑 ---
  const handleAIConfirm = (result: any) => {
    try {
        if (result && !result.error) {
            // Clear existing
            setNodes([]);
            setEdges([]);

            // Create Trigger
            const triggerId = `trigger-${Date.now()}`;
            const triggerNode: FlowNode = {
                id: triggerId,
                type: 'custom',
                position: { x: 100, y: 100 },
                data: {
                    label: 'Price Trigger',
                    type: 'trigger',
                    operator: result.trigger.operator,
                    threshold: result.trigger.threshold.toString()
                }
            };

            // Create Action
            const actionId = `action-${Date.now()}`;
            const actionNode: FlowNode = {
                id: actionId,
                type: 'custom',
                position: { x: 100, y: 350 },
                data: {
                    label: 'Uniswap Action',
                    type: 'action',
                    fromToken: result.action.fromToken,
                    toToken: result.action.toToken,
                    amountType: result.action.amountType,
                    amount: result.action.amount
                }
            };

            // Create Edge
            const edge: FlowEdge = {
                id: `${triggerId}-${actionId}`,
                source: triggerId,
                target: actionId,
                animated: true,
                style: { stroke: '#3b82f6', strokeWidth: 2 },
                markerEnd: { type: MarkerType.ArrowClosed, color: '#3b82f6' },
            };

            setNodes([triggerNode, actionNode]);
            setEdges([edge]);
            
            setTimeout(() => fitView({ duration: 800 }), 100);
        } else {
            alert("Failed to parse intent.");
        }
    } catch (e) {
        console.error(e);
        alert("Error generating workflow.");
    }
  };

  // --- 启动校验逻辑 ---
  const handleStart = () => {
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

  // --- 核心监控逻辑 (Price Check) ---
  useEffect(() => {
    if (!isRunning || showModal) return;

    const triggerNode = nodes.find(n => n.data.type === 'trigger');
    if (!triggerNode) return;

    const operator = triggerNode.data.operator as string;
    const threshold = parseFloat(triggerNode.data.threshold as string);

    if (isNaN(threshold)) return;

    let triggered = false;
    // 简单的判断逻辑
    if (operator === '>' && currentPrice > threshold) triggered = true;
    if (operator === '<' && currentPrice < threshold) triggered = true;

    if (triggered) {
        // Prevent infinite loop: if already active, skip update
        if (triggerNode.data.active) return;

        // 视觉反馈：让节点变绿
        setNodes(nds => nds.map(n => ({...n, data: {...n.data, active: true}})));
        
        // 延迟一点弹出成功框，体验更好
        setTimeout(() => {
            setIsRunning(false);
            setShowModal(true);
            setNodes(nds => nds.map(n => ({...n, data: {...n.data, active: false}}))); // 重置样式
        }, 800);
    }
  }, [currentPrice, isRunning, nodes, showModal, setNodes]);

  return (
    <div className="w-full h-screen flex flex-col bg-stone-50 overflow-hidden font-sans">
      {/* 顶部栏 */}
      <div className="h-16 border-b bg-white flex items-center justify-between px-6 z-30 shadow-sm relative">
        <div className="flex items-center gap-6">
            <div className="font-bold text-xl flex items-center gap-2 tracking-tight text-stone-900">
                🤖 DefiFlow <span className="text-[10px] bg-stone-900 text-white px-1.5 py-0.5 rounded font-mono">BETA</span>
            </div>
            <PriceTicker onPriceUpdate={setCurrentPrice} />
        </div>
        
        <div className="flex items-center gap-4">
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

      {/* 主体 */}
      <div className="flex-1 flex h-full" ref={reactFlowWrapper}>
        <Sidebar onAIClick={() => setShowAIModal(true)} />
        
        <div className="flex-1 h-full bg-stone-100/50 relative">
           {nodes.length === 0 && (
             <div className="absolute inset-0 flex items-center justify-center text-stone-300 pointer-events-none z-10">
               <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                  <div className="bg-white p-4 rounded-full shadow-sm">
                      <MousePointer2 className="w-8 h-8 text-stone-400" />
                  </div>
                  <span className="text-sm font-medium text-stone-400">Drag components from the sidebar to start</span>
               </div>
             </div>
           )}

          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-right"
          >
            <Background color="#cbd5e1" gap={24} size={1} />
            <Controls className="bg-white border border-stone-200 shadow-lg rounded-xl overflow-hidden !m-4" />
            <MiniMap 
                className="!border border-stone-200 !rounded-xl !shadow-lg !m-4" 
                maskColor="rgba(255, 255, 255, 0.8)" 
                nodeColor={(n) => n.data.type === 'trigger' ? '#3b82f6' : '#ec4899'} 
            />
          </ReactFlow>
        </div>
      </div>

      {showModal && <SuccessModal onClose={() => setShowModal(false)} />}
      {showAIModal && <AIModal onClose={() => setShowAIModal(false)} onConfirm={handleAIConfirm} />}
    </div>
  );
};

// ==========================================
// 6. 导出根组件
// ==========================================
export default function App() {
  return (
    <ReactFlowProvider>
      <FlowArea />
    </ReactFlowProvider>
  );
}
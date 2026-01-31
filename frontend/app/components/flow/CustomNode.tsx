// app/components/flow/CustomNode.tsx
import React from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Zap, Repeat, ArrowRight } from 'lucide-react';

export const CustomNode = ({ id, data }: { id: string, data: any }) => {
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
           
           <div className="flex gap-2 items-center pt-1 border-t border-stone-700 mt-1">
             <span className="text-[10px] text-stone-400 font-mono w-8">To:</span>
             <input 
                type="text"
                className="nodrag flex-1 bg-stone-800 border border-stone-600 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono placeholder-stone-600"
                placeholder="0x...Address"
                value={data.recipient || ""}
                onChange={(e) => handleChange('recipient', e.target.value)}
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

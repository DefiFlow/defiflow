// app/components/flow/CustomNode.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { Repeat, ArrowRight, CheckCircle, Wallet, Loader2, Plus, Trash2, Search } from 'lucide-react';
import { ethers } from 'ethers';
import { useFlowStore } from '../../store/useFlowStore';

const isValidAddress = (addr: string) => /^0x[a-fA-F0-9]{40}$/.test(addr);
const isEnsName = (name: string) => name.endsWith('.eth');

// 使用懒加载初始化 Provider，避免 SSR 期间因相对路径报错
let ensProvider: ethers.JsonRpcProvider | null = null;
const getEnsProvider = () => {
  if (!ensProvider && typeof window !== 'undefined') {
    ensProvider = new ethers.JsonRpcProvider(window.location.origin + "/api/rpc");
  }
  return ensProvider;
};

const RecipientRow = ({
  index,
  recipient,
  onChange,
  onRemove
}: {
  index: number;
  recipient: { address: string; amount: number; input?: string };
  onChange: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
}) => {
  const [localInput, setLocalInput] = useState(recipient.input || recipient.address || '');
  const [isResolving, setIsResolving] = useState(false);
  const [isValid, setIsValid] = useState(isValidAddress(recipient.address || ''));

  useEffect(() => {
    if (recipient.input && recipient.input !== localInput) {
      setLocalInput(recipient.input);
    }
  }, [recipient.input]);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalInput(val);
    onChange(index, 'input', val);

    if (isEnsName(val)) {
      setIsValid(false);
      setIsResolving(true);
      try {
        const provider = getEnsProvider();
        const addr = provider ? await provider.resolveName(val) : null;
        console.log(addr)
        if (addr) {
          onChange(index, 'address', addr);
          setIsValid(true);
        } else {
          onChange(index, 'address', '');
          setIsValid(false);
        }
      } catch {
        onChange(index, 'address', '');
        setIsValid(false);
      } finally {
        setIsResolving(false);
      }
    } else if (isValidAddress(val)) {
      onChange(index, 'address', val);
      setIsValid(true);
      setIsResolving(false);
    } else {
      onChange(index, 'address', '');
      setIsValid(false);
      setIsResolving(false);
    }
  };

  return (
    <div className="flex gap-2 items-start group/row animate-in fade-in slide-in-from-left-2 duration-300">
      <div className="flex-1 relative">
        <input
          type="text"
          className={`nodrag w-full border rounded-lg pl-2 pr-6 py-1.5 text-[10px] text-white bg-white/5 focus:outline-none font-mono transition-all
            ${isValid ? 'border-green-500/30 focus:border-green-500' : 'border-stone-700 focus:border-blue-500'}
          `}
          placeholder="ENS or 0x..."
          value={localInput}
          onChange={handleInputChange}
        />
        {isResolving ? (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-500 animate-spin" />
        ) : isValid && (
          <CheckCircle className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-green-500" />
        )}
      </div>
      <input
        type="number"
        className="nodrag w-14 border border-stone-700 rounded-lg px-1.5 py-1.5 text-[10px] text-white bg-white/5 focus:outline-none focus:border-blue-500 font-mono text-center"
        placeholder="Amt"
        value={recipient.amount || ''}
        onChange={(e) => onChange(index, 'amount', e.target.value)}
      />
      <button
        onClick={() => onRemove(index)}
        className="p-1.5 rounded-lg text-stone-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/row:opacity-100"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
};

export const CustomNode = ({ id, data }: { id: string, data: any }) => {
  const { updateNodeData } = useReactFlow();
  const currentPrice = useFlowStore((state) => state.currentPrice);

  useEffect(() => {
    if (data.type === 'action') {
      const amount = parseFloat(data.input || '0');
      if (!isNaN(amount) && currentPrice > 0) {
        const calculated = amount * currentPrice;
        const formatted = `~${calculated.toLocaleString('en-US', { maximumFractionDigits: 0 })} USDC`;
        if (data.output !== formatted) updateNodeData(id, { output: formatted });
      }
    }
  }, [data.input, currentPrice, data.type, id, updateNodeData, data.output]);

  const handleChange = (field: string, value: string) => {
    updateNodeData(id, { ...data, [field]: value });
  };

  const recipients = data.recipients || [];

  const addRecipient = useCallback(() => {
    if (recipients.length >= 5) return;
    const newRecipients = [...recipients, { address: '', amount: 0, input: '' }];
    updateNodeData(id, { ...data, recipients: newRecipients });
  }, [id, data, recipients, updateNodeData]);

  const removeRecipient = useCallback((index: number) => {
    const newRecipients = recipients.filter((_: any, i: number) => i !== index);
    updateNodeData(id, { ...data, recipients: newRecipients });
  }, [id, data, recipients, updateNodeData]);

  const updateRecipient = useCallback((index: number, field: string, value: any) => {
    const newRecipients = [...recipients];
    newRecipients[index] = { ...newRecipients[index], [field]: value };
    updateNodeData(id, { ...data, recipients: newRecipients });
  }, [id, data, recipients, updateNodeData]);

  const getTypeStyles = () => {
    switch (data.type) {
      case 'ens': return 'border-[#FFB800]/50 hover:border-[#FFB800] shadow-yellow-500/10';
      case 'action': return 'border-[#FF5D73]/50 hover:border-[#FF5D73] shadow-pink-500/10';
      case 'transfer': return 'border-[#41E43E]/50 hover:border-[#41E43E] shadow-green-500/10';
      default: return 'border-stone-700 hover:border-stone-500';
    }
  };

  const getBackgroundStyle = () => {
    switch (data.type) {
      case 'ens': return { background: 'linear-gradient(90deg, #725A2B 0%, #1B1D1F 100%)' };
      case 'action': return { background: 'linear-gradient(90deg, #69314D 0%, #1B1D1F 100%)' };
      case 'transfer': return { background: 'linear-gradient(90deg, #306357 0%, #1B1D1F 100%)' };
      default: return { background: '#1A1D24' };
    }
  };

  const getIcon = () => {
    switch (data.type) {
      case 'ens': return <Search className="w-4 h-4 text-[#FFB800]" />;
      case 'action': return <Repeat className="w-4 h-4 text-[#FF5D73]" />;
      case 'transfer': return <Wallet className="w-4 h-4 text-[#41E43E]" />;
      default: return null;
    }
  };

  return (
    <div
      className={`px-4 py-4 shadow-2xl rounded-2xl border min-w-[260px] transition-all duration-300 backdrop-blur-sm
        ${getTypeStyles()}
        ${data.active ? 'ring-2 ring-blue-500/40 border-blue-400' : ''}
      `}
      style={getBackgroundStyle()}
    >
      {/* Top Handle */}
      {(data.type === 'ens' || data.type === 'transfer') && (
        <Handle
          type="target"
          position={Position.Top}
          className="!bg-[#2A2B32] !border-2 !border-stone-600 !w-3 !h-3 !-top-1.5 hover:!scale-125 transition-transform"
        />
      )}

      {/* Title Bar */}
      <div className="flex items-center gap-3 mb-4 border-b border-stone-800/50 pb-3">
        <div className="p-1.5 rounded-lg bg-stone-800/50">
          {getIcon()}
        </div>
        <span className="font-bold text-sm text-white tracking-tight">
          {data.type === 'transfer' ? 'Arc Payroll' : data.type === 'ens' ? 'ENS Resolver' : data.label}
        </span>
        <div className="ml-auto w-2 h-2 rounded-full bg-stone-700"></div>
      </div>

      {/* Content Area */}
      {data.type === 'ens' ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-bold text-stone-500 uppercase tracking-tighter">ENS List ({recipients.length}/5)</label>
            </div>
            
            <div className="flex flex-col gap-2">
              {recipients.map((r: any, i: number) => (
                <RecipientRow
                  key={i}
                  index={i}
                  recipient={r}
                  onChange={updateRecipient}
                  onRemove={removeRecipient}
                />
              ))}
            </div>

            {recipients.length < 5 && (
              <button
                onClick={addRecipient}
                className="flex items-center justify-center gap-1.5 w-full py-1.5 rounded-lg border border-dashed border-stone-700 text-[10px] text-stone-400 hover:text-white hover:border-stone-500 hover:bg-white/5 transition-all mt-1"
              >
                <Plus className="w-3 h-3" />
                Add ENS
              </button>
            )}
          </div>
        </div>
      ) : data.type === 'action' ? (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-stone-500 uppercase tracking-tighter">Input</label>
            <input
              type="text"
              className="nodrag w-full border border-stone-700 rounded-lg px-3 py-2 text-xs text-white bg-white/10 focus:outline-none focus:border-pink-500 font-mono"
              placeholder="10 ETH (Sepolia)"
              value={data.input || ''}
              onChange={(e) => handleChange('input', e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-stone-500 uppercase tracking-tighter">Output</label>
            <input
              type="text"
              className="nodrag w-full border border-stone-700 rounded-lg px-3 py-2 text-xs text-white bg-white/10 focus:outline-none focus:border-pink-500 font-mono"
              placeholder="~28,000 USDC"
              value={data.output || ''}
              readOnly
            />
          </div>
        </div>
      ) : (
        /* Transfer Node UI */
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <div className="p-3 bg-white/5 rounded-lg border border-stone-700/50">
              <p className="text-[10px] text-stone-400 leading-relaxed">
                <span className="text-green-400 font-bold">Linked:</span> Executing payroll for addresses resolved in the ENS node.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-tighter">Memo</label>
            <input
              type="text"
              className="nodrag w-full border border-stone-700 rounded-lg px-3 py-2 text-xs text-white bg-white/10 focus:outline-none focus:border-green-500 font-mono"
              placeholder="e.g., Salary Distribution"
              value={data.memo || ''}
              onChange={(e) => handleChange('memo', e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Bottom Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!bg-[#2A2B32] !border-2 !border-stone-600 !w-3 !h-3 !-bottom-1.5 hover:!scale-125 transition-transform"
      />
    </div>
  );
};
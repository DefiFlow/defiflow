// app/store/useFlowStore.ts
import { create } from 'zustand';
import {
  Edge,
  Node,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
} from '@xyflow/react';

export type FlowNode = Node;
export type FlowEdge = Edge;

interface FlowState {
  // React Flow State
  nodes: FlowNode[];
  edges: FlowEdge[];
  
  // App State
  currentPrice: number;
  isRunning: boolean;
  walletAddress: string | null;
  txHash: string | null;
  
  // Modals State
  showSuccessModal: boolean;
  showAIModal: boolean;

  // Actions
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  setNodes: (nodes: FlowNode[]) => void;
  setEdges: (edges: FlowEdge[]) => void;
  setCurrentPrice: (price: number) => void;
  setIsRunning: (isRunning: boolean) => void;
  setWalletAddress: (address: string | null) => void;
  setTxHash: (hash: string | null) => void;
  setShowSuccessModal: (show: boolean) => void;
  setShowAIModal: (show: boolean) => void;
  resetFlow: () => void;
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: [],
  edges: [],
  currentPrice: 0,
  isRunning: false,
  walletAddress: null,
  txHash: null,
  showSuccessModal: false,
  showAIModal: false,

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },
  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  onConnect: (connection) => {
    set({
      edges: addEdge(connection, get().edges),
    });
  },
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setCurrentPrice: (currentPrice) => set({ currentPrice }),
  setIsRunning: (isRunning) => set({ isRunning }),
  setWalletAddress: (walletAddress) => set({ walletAddress }),
  setTxHash: (txHash) => set({ txHash }),
  setShowSuccessModal: (showSuccessModal) => set({ showSuccessModal }),
  setShowAIModal: (showAIModal) => set({ showAIModal }),
  resetFlow: () => set({ nodes: [], edges: [] }),
}));

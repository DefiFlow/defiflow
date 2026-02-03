Here is the full English version of the AI Refactoring Instructions and the README.md. You can copy-paste these directly.

1. Refactoring Instructions for your AI Agent
Copy and paste this prompt to your AI coding assistant to start the code changes.

System Prompt: You are an expert Web3 Full-Stack Developer. I need you to refactor my project, FlowState (formerly DefiFlow), to pivot from a "Passive Monitoring Tool" to an "Active Cross-Chain Payroll Agent."

Core Objectives:

Simplify Logic: Remove all "Price Trigger" and background monitoring logic.

New Workflow: Implement a linear "Source -> Bridge -> Distribute" flow triggered immediately by the user.

Integrations: Ensure distinct interactions with Uniswap v4 (Sepolia), LI.FI (Cross-chain), and Arc (Testnet).

Specific Tasks:

A. Smart Contract (New)

Create a new contract ArcPayroll.sol to be deployed on Arc Testnet.

It should accept USDC and batch distribute it.

Function signature: distributeSalary(address token, address[] recipients, uint256[] amounts, string memo).

Emit an event SalaryDistributed containing the memo (e.g., "Feb Salary").

B. Frontend Logic (React Flow)

Node Structure: Hardcode the AI generation to produce exactly 3 nodes when the prompt involves "Payroll" or "Salary":

Uniswap Action (Purple): Swap ETH to USDC on Sepolia.

LI.FI Bridge (Pink): Bridge USDC from Sepolia to Arc.

Arc Payroll (Blue/Black): Distribute USDC to recipients.

ENS Integration: In the "Arc Payroll" node, integrate wagmi's useEnsAddress. Allow users to input names like vitalik.eth and auto-resolve them to 0x addresses.

Execution Flow: When "Start Agent" is clicked:

Trigger Uniswap Swap (Client-side signature).

Trigger LI.FI Bridge with contractCalls to the ArcPayroll contract (Client-side signature).

Do not require network switching if possible; execute everything from Sepolia.

C. Branding

Rename the project name in package.json and UI headers to "FlowState".

Change the team/footer name to "Scalar Labs".
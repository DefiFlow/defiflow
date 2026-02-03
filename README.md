# 🌊 FlowState: The Agentic Cross-Chain Payroll OS

> **"Pay your global team in one click, starting with ETH on Sepolia."**
> FlowState (built by **Scalar Labs**) is an AI-powered orchestration layer that turns natural language into atomic, multi-chain financial workflows.

---

## 📸 Demo & Screenshots

// TODO
**[🎥 Watch the Demo Video](https://www.google.com/search?q=YOUR_VIDEO_LINK_HERE)** | **[🚀 Try the Live App](https://www.google.com/search?q=YOUR_VERCEL_LINK_HERE)**

---

## 💡 The Problem

Managing a global Web3 team is painful:

* **Liquidity Fragmentation:** Your treasury is in ETH on Mainnet, but your employees want USDC on Arc or Base.
* **Manual Drudgery:** You have to manually swap on DEXs, bridge on separate UIs, and then send individual transfers.
* **Complex UX:** 3 apps, 5 transactions, and 20 minutes of work just to pay salaries.

## 🧠 The Solution: FlowState

FlowState is an **Intent-Centric Operating System**.

1. **AI Parser:** Just type *"Use my Sepolia ETH to pay 1000 USDC salary to Alice and Bob on Arc."*
2. **Visual Composer:** The AI instantly builds a 3-node workflow: **Source (Uniswap) -> Bridge (LI.FI) -> Settle (Arc)**.
3. **One-Click Execution:**
* **Step 1:** Atomically swaps ETH to USDC via **Uniswap v4**.
* **Step 2:** Bridges & Distributes via **LI.FI**'s programmable cross-chain calls.



---

## 🏆 Prize Integrations (Sponsors)

We proudly integrate the following technologies to create a seamless "Agentic Commerce" experience:

### 🦄 Uniswap Foundation (v4 Agentic Finance)

* **Liquidity Sourcing:** FlowState's AI agent programmatically interacts with **Uniswap v4** on Sepolia to source the necessary USDC liquidity from ETH.
* **Why v4?** We utilize the singleton architecture for gas-efficient swaps before bridging.
* **TxID:** [`0x...YOUR_SWAP_TX`](https://www.google.com/search?q=LINK_TO_SEPOLIA_ETHERSCAN)

### 🟣 LI.FI (Best Use of Composer)

* **Cross-Chain Orchestration:** We use the **LI.FI SDK** to orchestrate the complex move from Sepolia to Arc.
* **Remote Execution:** Instead of just bridging tokens, we use LI.FI's `contractCalls` feature to **trigger our Payroll Contract on the destination chain** automatically upon arrival.
* **TxID:** [`0x...YOUR_BRIDGE_TX`](https://www.google.com/search?q=LINK_TO_SEPOLIA_ETHERSCAN)

### 🅰️ Arc by Circle (Global Payouts & Agentic App)

* **RWA Settlement:** The final destination is **Arc Testnet**, where salaries are settled in **USDC** (Regulated Digital Dollar).
* **Smart Distribution:** Our custom `ArcPayroll` contract receives the bridged USDC and batch-distributes it to employees (Alice, Bob, etc.) in a single transaction.
* **TxID:** [`0x...YOUR_ARC_PAYOUT_TX`](https://www.google.com/search?q=LINK_TO_ARC_EXPLORER)

### 🔷 ENS (UX Enhancement)

* **Human-Readable:** Integrated ENS resolution for the payroll list. Users can type `vitalik.eth` instead of hex addresses.

---

## 🏗 Architecture
TODO
```mermaid
graph LR
    User[User Prompt: "Pay Salary"] --> AI[AI Agent]
    AI -->|Generates Workflow| UI[React Flow Interface]
    
    subgraph "Chain A: Sepolia"
        UI -->|1. Swap| Uni[🦄 Uniswap v4]
        Uni -->|USDC| UserWallet
        UI -->|2. Bridge & Call| LIFI[🟣 LI.FI SDK]
    end

    subgraph "Chain B: Arc Testnet"
        LIFI -->|Relayer| Contract[📜 ArcPayroll.sol]
        Contract -->|Transfer| Alice[User A (USDC)]
        Contract -->|Transfer| Bob[User B (USDC)]
    end

```

---

## 🔗 Verified Contracts

| Network | Contract Name | Address |
| --- | --- | --- |
| **Arc Testnet** | `ArcPayroll.sol` | [`0x...`](https://www.google.com/search?q=LINK_TO_ARC_EXPLORER) |
| **Sepolia** | `UniswapHelper` (Optional) | [`0x...`](https://www.google.com/search?q=LINK_TO_ETHERSCAN) |

---

## 🛠 Tech Stack

* **Frontend:** Next.js, React Flow, TailwindCSS, Shadcn/UI
* **Web3:** Wagmi, Viem
* **AI:** Gemini API
* **Integrations:** Uniswap v4 SDK, LI.FI SDK, Circle CCTP (via LI.FI)

---

## 🏃‍♂️ Getting Started

1. **Clone the repo**
```bash
git clone https://github.com/ScalarLabs/flowstate.git

```


2. **Install dependencies**
```bash
cd frontend && npm install

```


3. **Setup Environment**
```bash
cp .env.example .env.local
# Add your OPENAI_API_KEY and WALLET_PRIVATE_KEY

```


4. **Run Development Server**
```bash
npm run dev

```



---

*Built with ❤️ by **Scalar Labs** for ETHGlobal HackMoney 2026*
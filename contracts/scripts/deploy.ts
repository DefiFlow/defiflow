import { ethers } from "hardhat";

async function main() {
  // Uniswap V3 SwapRouter address (Sepolia)
  // For Mainnet use: 0xE592427A0AEce92De3Edee1F18E0157C05861564
  const SWAP_ROUTER = process.env.SWAP_ROUTER_ADDRESS;
  const WETH = process.env.WETH_ADDRESS;

  if (!SWAP_ROUTER || !WETH) {
    throw new Error("Please set SWAP_ROUTER_ADDRESS and WETH_ADDRESS in .env");
  }

  const AgentExecutor = await ethers.getContractFactory("AgentExecutor");
  const agent = await AgentExecutor.deploy(SWAP_ROUTER, WETH);

  await agent.waitForDeployment();

  console.log(`AgentExecutor deployed to: ${await agent.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
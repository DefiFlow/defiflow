const { ethers } = require("hardhat");

// --- Configure Constants ---
// Slightly offset from MIN/MAX to avoid boundary check errors
const MIN_SQRT_PRICE = "4295128740"; 
const MAX_SQRT_PRICE = "1461446703485210103287273052203988822378723970341"; 

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // --- 1. Address Configuration ---
  const POOL_SWAP_TEST_ADDRESS = "0x9b6b46e2c869aa39918db7f52f5557fe577b6eee";
  const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3"; // Add Permit2 address
  const M_ETH_ADDRESS = "0x5f403fdc672e1D6902eA5C4CB1329cB5698d0c33";
  const M_USDC_ADDRESS = "0x8B5c068AF3f6D2eeeE4c0c7575d4D8e52504ac01";

  // --- 2. Prepare Contracts and Tokens ---
  const erc20Abi = [
    "function approve(address spender, uint256 amount) external returns (bool)",
    "function allowance(address owner, address spender) external view returns (uint256)",
    "function balanceOf(address account) external view returns (uint256)"
  ];
  const mEthContract = new ethers.Contract(M_ETH_ADDRESS, erc20Abi, signer);
  const mUsdcContract = new ethers.Contract(M_USDC_ADDRESS, erc20Abi, signer);

  // --- 3. Check Balance ---
  const balanceMeth = await mEthContract.balanceOf(signer.address);
  console.log(`\nmETH Balance: ${ethers.utils.formatUnits(balanceMeth, 18)}`);
  
  if (balanceMeth.lt(ethers.utils.parseUnits("0.001", 18))) {
    console.error("❌ Error: Insufficient mETH balance for swap!");
    return;
  }

  // --- 4. Full Approval (to prevent failures due to different payment methods) ---
  console.log("Checking approvals...");
  const maxUint = ethers.constants.MaxUint256;

  // 4.1 Approve PoolSwapTest (direct debit mode)
  const allowanceSwap = await mEthContract.allowance(signer.address, POOL_SWAP_TEST_ADDRESS);
  if (allowanceSwap.lt(maxUint.div(2))) {
    console.log("Approving PoolSwapTest...");
    await (await mEthContract.approve(POOL_SWAP_TEST_ADDRESS, maxUint)).wait();
  }

  // 4.2 Approve Permit2 (Permit2 debit mode)
  const allowancePermit2 = await mEthContract.allowance(signer.address, PERMIT2_ADDRESS);
  if (allowancePermit2.lt(maxUint.div(2))) {
    console.log("Approving Permit2...");
    await (await mEthContract.approve(PERMIT2_ADDRESS, maxUint)).wait();
  }

  // --- 5. Build Swap Parameters ---
  
  // 5.1 Sort tokens and determine direction
  const isMethToken0 = M_ETH_ADDRESS.toLowerCase() < M_USDC_ADDRESS.toLowerCase();
  const token0 = isMethToken0 ? M_ETH_ADDRESS : M_USDC_ADDRESS;
  const token1 = isMethToken0 ? M_USDC_ADDRESS : M_ETH_ADDRESS;
  
  // Scenario: Sell mETH. If mETH is token0, it's a 0->1 swap.
  const zeroForOne = isMethToken0; 
  
  // 5.2 Build PoolKey
  const poolKey = {
    currency0: token0,
    currency1: token1,
    fee: 3000,
    tickSpacing: 60,
    hooks: "0x0000000000000000000000000000000000000000",
  };

  // 5.3 Swap Parameters
  // Negative number = Exact Input (pay an exact amount)
  const amountSpecified = ethers.utils.parseUnits("-0.001", 18); 

  // Price limit: for 0->1, price decreases, set to MIN; for 1->0, price increases, set to MAX
  const sqrtPriceLimitX96 = zeroForOne ? MIN_SQRT_PRICE : MAX_SQRT_PRICE;

  const swapParams = {
    zeroForOne: zeroForOne,
    amountSpecified: amountSpecified,
    sqrtPriceLimitX96: sqrtPriceLimitX96,
  };

  const testSettings = {
    takeClaims: false,
    settleUsingBurn: false,
  };

  // --- 6. Define ABI (including custom errors for debugging) ---
  const poolSwapTestABI = [
    // Main function
    "function swap((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, (bool zeroForOne, int256 amountSpecified, uint160 sqrtPriceLimitX96) params, (bool takeClaims, bool settleUsingBurn) testSettings, bytes hookData) external payable returns (int256 delta)",
    // Common error definitions (to help Ethers parse revert reasons)
    "error NoSwapOccurred()",
    "error PoolNotInitialized()",
    "error CheckpointUnordered()", 
    "error TickSpacingTooLarge()",
    "error InvalidTickSpacing()"
  ];

  const poolSwapTest = new ethers.Contract(POOL_SWAP_TEST_ADDRESS, poolSwapTestABI, signer);

  console.log(`\nExecuting Swap: 0.001 mETH -> mUSDC`);
  console.log(`Direction: ${zeroForOne ? "Token0 -> Token1" : "Token1 -> Token0"}`);
  
  try {
    // Send transaction
    // Note: pass "0x" for hookData, set gasLimit to 5,000,000 just in case
    const tx = await poolSwapTest.swap(
      poolKey, 
      swapParams, 
      testSettings, 
      "0x", 
      { gasLimit: 5000000 }
    );
    
    console.log("Transaction sent:", tx.hash);
    console.log("Waiting for confirmation...");
    
    const receipt = await tx.wait();
    console.log("✅ Swap Successful!");
    console.log(`Block Number: ${receipt.blockNumber}`);
    
    // Print new balance
    const newBalance = await mEthContract.balanceOf(signer.address);
    console.log(`New mETH Balance: ${ethers.utils.formatUnits(newBalance, 18)}`);

  } catch (error) {
    console.error("\n❌ Swap Failed:");
    
    // Try to extract more detailed error information
    if (error.reason) console.error("Revert Reason:", error.reason);
    if (error.code) console.error("Error Code:", error.code);
    if (error.data) console.error("Error Data:", error.data);
    
    // If it's a custom error, Ethers v5 sometimes can't parse it automatically, so print the raw data
    if (error.error && error.error.data) {
        console.error("Raw Revert Data:", error.error.data);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
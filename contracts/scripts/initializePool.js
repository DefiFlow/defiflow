const { ethers } = require("hardhat");

// --- Helper function to calculate initial sqrtPriceX96 ---
// Formula: sqrtPriceX96 = sqrt(token1 / token0) * 2^96
function encodePriceSqrt(reserve1, reserve0) {
  // Use BigInt to avoid precision loss
  const amount1 = BigInt(reserve1.toString());
  const amount0 = BigInt(reserve0.toString());

  const numerator = amount1 * (2n ** 192n);
  const ratio = numerator / amount0;

  // Integer square root algorithm
  let z = (ratio + 1n) / 2n;
  let y = ratio;
  while (z < y) {
    y = z;
    z = (ratio / z + z) / 2n;
  }

  return y;
}

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // --- 1. Address Configuration ---
  const POOL_MANAGER_ADDRESS = "0xE03A1074c86CFeDd5C142C4F04F1a1536e203543";
  const M_ETH_ADDRESS = "0x5f403fdc672e1D6902eA5C4CB1329cB5698d0c33";
  const M_USDC_ADDRESS = "0x8B5c068AF3f6D2eeeE4c0c7575d4D8e52504ac01";

  // --- 2. Token Information ---
  // Since we know we're using mETH and mUSDC with 18 decimals, we can hardcode for simplicity.
  // To fetch dynamically, you could use new ethers.Contract(...)
  const DECIMALS = 18;

  // --- 3. Sort Tokens (A core requirement for Uniswap v4) ---
  // The address of token0 must be less than the address of token1.
  const isMethToken0 = M_ETH_ADDRESS.toLowerCase() < M_USDC_ADDRESS.toLowerCase();

  const token0 = isMethToken0 ? M_ETH_ADDRESS : M_USDC_ADDRESS;
  const token1 = isMethToken0 ? M_USDC_ADDRESS : M_ETH_ADDRESS;

  console.log(`\nSorted Tokens:`);
  console.log(`Token0: ${token0} (${isMethToken0 ? "mETH" : "mUSDC"})`);
  console.log(`Token1: ${token1} (${isMethToken0 ? "mUSDC" : "mETH"})`);

  // --- 4. Calculate Initial Price ---
  // Target: 1 mETH = 2000 mUSDC
  // Logic: Price is always represented as the ratio of token1 to token0 (Price = token1 / token0)
  
  console.log(`\nTarget Price: 1 mETH = 2000 mUSDC`);

  // Use ethers v5 utils to handle decimals
  const amountOneMeth = ethers.utils.parseUnits("1", DECIMALS);
  const amount2000Usdc = ethers.utils.parseUnits("2000", DECIMALS);

  let amount0, amount1;

  if (isMethToken0) {
    // Case A: token0 is mETH
    // Price = mUSDC / mETH
    amount0 = amountOneMeth; // denominator
    amount1 = amount2000Usdc; // numerator
  } else {
    // Case B: token0 is mUSDC (unlikely with these addresses, but good to have robust logic)
    // Price = mETH / mUSDC
    amount0 = amount2000Usdc;
    amount1 = amountOneMeth;
  }

  // Calculate sqrtPriceX96
  const sqrtPriceX96 = encodePriceSqrt(amount1.toString(), amount0.toString());
  console.log(`Calculated sqrtPriceX96: ${sqrtPriceX96.toString()}`);

  // --- 5. Initialize Pool ---
  const poolKey = {
    currency0: token0,
    currency1: token1,
    fee: 3000,       // 0.3% fee
    tickSpacing: 60, // Recommended tick spacing for 0.3% fee
    hooks: "0x0000000000000000000000000000000000000000", // No hooks
  };

  // ABI definition (note that structs are passed as tuples)
  const poolManagerABI = [
    "function initialize((address currency0, address currency1, uint24 fee, int24 tickSpacing, address hooks) key, uint160 sqrtPriceX96) external returns (int24 tick)"
  ];

  const poolManager = new ethers.Contract(POOL_MANAGER_ADDRESS, poolManagerABI, signer);

  console.log("\nSending initialize transaction...");

  try {
    // Note: We pass sqrtPriceX96 as a string; ethers v5 handles the BigNumber conversion.
    const tx = await poolManager.initialize(poolKey, sqrtPriceX96.toString());
    console.log("Transaction Hash:", tx.hash);

    console.log("Waiting for confirmation...");
    const receipt = await tx.wait();
    
    console.log("✅ Pool Initialized Successfully!");
    console.log("Block Number:", receipt.blockNumber);
  } catch (error) {
    // Simple error handling for when the pool already exists
    if (error.reason && error.reason.includes("PoolAlreadyInitialized")) {
        console.log("⚠️  Pool already initialized (PoolAlreadyInitialized).");
    } else if (error.message && error.message.includes("PoolAlreadyInitialized")) {
        console.log("⚠️  Pool already initialized (PoolAlreadyInitialized).");
    } else {
        console.error("❌ Initialization Failed:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
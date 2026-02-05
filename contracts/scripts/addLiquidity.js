const { ethers } = require("hardhat");
const { Token, Percent } = require("@uniswap/sdk-core");
const { Pool, Position, V4PositionManager } = require("@uniswap/v4-sdk");
const JSBI = require("jsbi");

// --- Helper functions for tick calculation (no external libs) ---
// 1. Calculate tick from sqrtPriceX96
function getTickAtSqrtRatio(sqrtPriceX96Str) {
  const sqrtPrice = BigInt(sqrtPriceX96Str);
  const q96 = 2n ** 96n;
  const ratio = Number(sqrtPrice) / Number(q96);
  const price = ratio * ratio;
  // tick = log_sqrt(1.0001)(sqrtRatio) which is approx. ln(price) / ln(1.0001)
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

// 2. Align tick to the nearest multiple of tickSpacing
function nearestUsableTick(tick, tickSpacing) {
  const rounded = Math.round(tick / tickSpacing) * tickSpacing;
  if (rounded < -887272) return rounded + tickSpacing;
  if (rounded > 887272) return rounded - tickSpacing;
  return rounded;
}

async function main() {
  const [signer] = await ethers.getSigners();
  console.log("Using account:", signer.address);

  // --- 1. Configure Addresses (Sepolia) ---
  // Make sure these addresses are up-to-date
  const POSITION_MANAGER_ADDRESS = "0x429ba70129df741B2Ca2a85BC3A2a3328e5c09b4"; 
  const PERMIT2_ADDRESS = "0x000000000022D473030F116dDEE9F6B43aC78BA3";
  
  const M_ETH_ADDRESS = "0x5f403fdc672e1D6902eA5C4CB1329cB5698d0c33"; 
  const M_USDC_ADDRESS = "0x8B5c068AF3f6D2eeeE4c0c7575d4D8e52504ac01"; 
  
  const CHAIN_ID = 11155111; 

  // --- 2. Prepare Tokens ---
  const DECIMALS = 18;
  const token0 = new Token(CHAIN_ID, M_ETH_ADDRESS, DECIMALS, "mETH");
  const token1 = new Token(CHAIN_ID, M_USDC_ADDRESS, DECIMALS, "mUSDC");

  // --- 3. Handle Approvals (Crucial Step) ---
  // Uniswap v4 flow: User -> Approve Permit2 -> Permit2 approves PositionManager
  const erc20Abi = ["function approve(address spender, uint256 amount) external returns (bool)"];
  const permit2Abi = ["function approve(address token, address spender, uint160 amount, uint48 expiration) external"];

  const mEthContract = new ethers.Contract(M_ETH_ADDRESS, erc20Abi, signer);
  const mUsdcContract = new ethers.Contract(M_USDC_ADDRESS, erc20Abi, signer);
  const permit2Contract = new ethers.Contract(PERMIT2_ADDRESS, permit2Abi, signer);

  console.log("\n1. Approving Permit2 (Token -> Permit2)...");
  // Use ethers.constants.MaxUint256 (ethers v5 syntax)
  await (await mEthContract.approve(PERMIT2_ADDRESS, ethers.constants.MaxUint256)).wait();
  await (await mUsdcContract.approve(PERMIT2_ADDRESS, ethers.constants.MaxUint256)).wait();

  console.log("2. Approving PositionManager (Permit2 -> PositionManager)...");
  const expiration = Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60; // 30 days
  const maxAmount160 = "1461501637330902918203684832716283019655932542975"; 
  
  await (await permit2Contract.approve(M_ETH_ADDRESS, POSITION_MANAGER_ADDRESS, maxAmount160, expiration)).wait();
  await (await permit2Contract.approve(M_USDC_ADDRESS, POSITION_MANAGER_ADDRESS, maxAmount160, expiration)).wait();
  console.log("Approvals done.");

  // --- 4. Reconstruct Pool State ---
  // Use the pre-calculated initial price (1 mETH = 2000 mUSDC)
  const sqrtPriceX96Str = "3543191142285914205922034323214";
  const sqrtPriceX96 = JSBI.BigInt(sqrtPriceX96Str);
  const fee = 3000;
  const tickSpacing = 60;

  const currentTick = getTickAtSqrtRatio(sqrtPriceX96Str);
  console.log(`\nCurrent Tick: ${currentTick}`);

  const pool = new Pool(
    token0,
    token1,
    fee,
    tickSpacing,
    "0x0000000000000000000000000000000000000000",
    sqrtPriceX96,
    0, 
    currentTick
  );

  // --- 5. Configure Liquidity Range ---
  // Set a range of +/- 1200 ticks (approx. 10-12%) around the current price
  const tickLower = nearestUsableTick(currentTick - 1200, tickSpacing);
  const tickUpper = nearestUsableTick(currentTick + 1200, tickSpacing);

  console.log(`Range: ${tickLower} -> ${tickUpper}`);

  // --- 6. Set Deposit Amounts ---
  // Deposit 0.1 mETH and 500 mUSDC (the SDK will calculate the exact ratio)
  const amount0Desired = ethers.utils.parseUnits("0.1", 18); 
  const amount1Desired = ethers.utils.parseUnits("500", 18); 

  const position = Position.fromAmounts({
    pool: pool,
    tickLower: tickLower,
    tickUpper: tickUpper,
    amount0: amount0Desired.toString(),
    amount1: amount1Desired.toString(),
    useFullPrecision: true
  });

  console.log(`\nMinting Amounts:`);
  console.log(`mETH: ${position.mintAmounts.amount0.toString()}`);
  console.log(`mUSDC: ${position.mintAmounts.amount1.toString()}`);

  // --- 7. Send Transaction ---
  const mintOptions = {
    recipient: signer.address,
    deadline: Math.floor(Date.now() / 1000) + 1800, // 30 minute deadline
    slippageTolerance: new Percent(50, 10000), // 0.5% slippage
  };

  const { calldata, value } = V4PositionManager.addCallParameters(position, mintOptions);

  const positionManagerABI = ["function multicall(bytes[] calldata data) external payable returns (bytes[] memory results)"];
  const positionManager = new ethers.Contract(POSITION_MANAGER_ADDRESS, positionManagerABI, signer);

  console.log("\nSending Mint Transaction...");
  
  try {
    // The SDK returns a hex string for `value`, which ethers v5 handles directly
    const tx = await positionManager.multicall([calldata], { value: value });
    console.log("Tx sent:", tx.hash);
    
    console.log("Waiting for confirmation...");
    await tx.wait();
    console.log("✅ Liquidity Added Successfully!");
  } catch (e) {
    console.error("Mint failed:", e);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
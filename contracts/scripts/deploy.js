const hre = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment to Arc Testnet...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("👨‍💻 Deploying contracts with the account:", deployer.address);

  // 1. Deploy MockUSDC (your private treasury)
  // This way you have a fully controllable USDC on Arc, and transfers always succeed during demonstrations.
  const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
  const usdc = await MockUSDC.deploy();
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log("💰 MockUSDC deployed to:", usdcAddress);

  // 2. Deploy ArcPayroll (core payroll contract)
  const ArcPayroll = await hre.ethers.getContractFactory("ArcPayroll");
  const payroll = await ArcPayroll.deploy();
  await payroll.waitForDeployment();
  const payrollAddress = await payroll.getAddress();
  console.log("📜 ArcPayroll deployed to:", payrollAddress);

  console.log("\n----------------------------------------------------");
  console.log("🎉 Deployment Complete! Save these for your Frontend application:");
  console.log("----------------------------------------------------");
  console.log(`NEXT_PUBLIC_ARC_USDC_ADDRESS="${usdcAddress}"`);
  console.log(`NEXT_PUBLIC_ARC_PAYROLL_ADDRESS="${payrollAddress}"`);
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || ""; // 记得把私钥放在 .env 里，别传 GitHub！

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
        enabled: true,
      },
      chainId: 31337,
    },
    // 1. 你的开发主战场
    sepolia: {
      url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY],
    },
    // 2. 为了拿 Base 的钱
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC_URL || "https://sepolia.base.org",
      accounts: [PRIVATE_KEY],
    },
    // 3. 为了拿 Scroll 的钱
    scrollSepolia: {
      url: process.env.SCROLL_SEPOLIA_RPC_URL || "https://sepolia-rpc.scroll.io/",
      accounts: [PRIVATE_KEY],
    },
  },
  // 自动开源验证配置
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || '', // 去 Etherscan 申请一个
      baseSepolia: process.env.BASESCAN_API_KEY || '',
      // Scroll 需要特殊的配置，具体看官方文档
    },
  },
};

export default config;
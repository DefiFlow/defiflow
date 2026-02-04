import type { NextConfig } from "next";

console.log(process.env.ALCHEMY_API_KEY);

const nextConfig: NextConfig = {
  /* config options here */
  output: 'standalone',
  env: {
    // Arc contract addresses
    NEXT_PUBLIC_AGENT_EXECUTOR_ADDRESS: "0xa7a2867E7C69af433FE10c098704ba44c54F1D7f",
    NEXT_PUBLIC_ARC_USDC_ADDRESS:"0x5399f667627bC3f170Ba91fEd251a0d4F76F6C7A",
    NEXT_PUBLIC_ARC_PAYROLL_ADDRESS:"0xa19F0dc6655772dB798F9b7eb1a4DC4f775f7f5b",
    NEXT_PUBLIC_ALCHEMY_API_KEY: process.env.ALCHEMY_API_KEY
  },
};

export default nextConfig;

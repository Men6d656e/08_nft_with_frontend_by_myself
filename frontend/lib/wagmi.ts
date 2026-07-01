import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { anvil, sepolia } from "wagmi/chains";
import { http } from "wagmi";

/**
 * Wagmi + RainbowKit configuration.
 *
 * Supports two networks:
 *   1. Anvil (local) — default RPC http://localhost:8545
 *   2. Sepolia (testnet) — requires NEXT_PUBLIC_SEPOLIA_RPC env var
 *
 * A WalletConnect Project ID (NEXT_PUBLIC_WC_PROJECT_ID) is required
 * for RainbowKit's wallet modal to function.
 */
export function getConfig() {
  const projectId = process.env.NEXT_PUBLIC_WC_PROJECT_ID;

  if (!projectId) {
    console.warn(
      "[wagmi] NEXT_PUBLIC_WC_PROJECT_ID is not set. RainbowKit may not work correctly."
    );
  }

  return getDefaultConfig({
    appName: "ManualNFT",
    projectId: projectId || "",
    chains: [anvil, sepolia],
    transports: {
      [anvil.id]: http(
        process.env.NEXT_PUBLIC_ANVIL_RPC || "http://localhost:8545"
      ),
      [sepolia.id]: http(
        process.env.NEXT_PUBLIC_SEPOLIA_RPC || ""
      ),
    },
  });
}

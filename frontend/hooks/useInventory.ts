"use client";

import { useState, useCallback, useRef } from "react";
import { useAccount, type Config } from "wagmi";
import { readContract } from "wagmi/actions";
import { getConfig } from "@/lib/wagmi";
import { manualNftAbi } from "@/generated";
import { getGatewayBase, resolveIPFS } from "@/lib/ipfs";

// Cache the wagmi config to avoid recreating it on every inventory fetch.
let _cachedConfig: Config | null = null;
function getCachedConfig(): Config {
  if (!_cachedConfig) {
    _cachedConfig = getConfig();
  }
  return _cachedConfig;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
}

export interface TokenInfo {
  id: number;
  uri: string;
  metadata: NFTMetadata | null;
}

/**
 * useInventory
 *
 * Custom hook that fetches the connected wallet's token inventory
 * by iterating through tokenOfOwnerByIndex and reading tokenURI
 * for each token.
 */
export function useInventory() {
  const { address } = useAccount();
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = useCallback(async () => {
    if (!address) return;

    setIsLoading(true);
    setError(null);

    try {
      const config = getCachedConfig();

      // Read the balance first
      const balance = (await readContract(config, {
        abi: manualNftAbi,
        address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
        functionName: "balanceOf",
        args: [address],
      })) as bigint;

      const count = Number(balance);
      const tokenList: TokenInfo[] = [];

      for (let i = 0; i < count; i++) {
        try {
          // Read token ID at owner index
          const tokenId = (await readContract(config, {
            abi: manualNftAbi,
            address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
            functionName: "tokenOfOwnerByIndex",
            args: [address, BigInt(i)],
          })) as bigint;

          const id = Number(tokenId);

          // Read token URI
          const uri = (await readContract(config, {
            abi: manualNftAbi,
            address: process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`,
            functionName: "tokenURI",
            args: [tokenId],
          })) as string;

          // Parse metadata
          let metadata: NFTMetadata | null = null;
          if (uri.startsWith("data:")) {
            try {
              const json = atob(uri.split(",")[1]);
              metadata = JSON.parse(json);
              // Resolve any ipfs:// image URIs to gateway URLs for <img> tags
              if (metadata?.image) {
                metadata.image = resolveIPFS(metadata.image);
              }
            } catch {
              // ignore parse errors
            }
          } else if (uri.startsWith("ipfs://")) {
            // Resolve via the configured IPFS provider (local or Pinata)
            const gateway = getGatewayBase();
            const cid = uri.replace("ipfs://", "");
            try {
              const res = await fetch(`${gateway}${cid}`);
              metadata = await res.json();
              // Resolve any ipfs:// image URIs to gateway URLs
              if (metadata?.image) {
                metadata.image = resolveIPFS(metadata.image);
              }
            } catch {
              // ignore fetch errors
            }
          }

          tokenList.push({ id, uri, metadata });
        } catch {
          // Skip errors for individual tokens
          continue;
        }
      }

      setTokens(tokenList);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch inventory";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  return {
    tokens,
    isLoading,
    error,
    fetchInventory,
  };
}

"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { type ReactNode, useState } from "react";
import { getConfig } from "@/lib/wagmi";

/**
 * Web3Providers
 *
 * Composes the required providers for Web3 functionality:
 *   WagmiProvider → QueryClientProvider → RainbowKitProvider
 *
 * Must be added to the root layout to enable wallet connections,
 * contract reads/writes, and the RainbowKit modal throughout the app.
 */
export function Web3Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // 30s before refetch
            retry: 2,
          },
        },
      })
  );

  const [wagmiConfig] = useState(() => getConfig());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: "#6366f1",
            accentColorForeground: "white",
            borderRadius: "medium",
            fontStack: "system",
          })}
          modalSize="compact"
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock the wagmi hooks used by the Home component
vi.mock("wagmi", () => ({
  useAccount: () => ({
    address: undefined,
    isConnected: false,
    chain: undefined,
  }),
  useConfig: () => ({}),
}));

vi.mock("@/generated", () => ({
  useReadManualNftBalanceOf: () => ({ data: undefined, refetch: vi.fn() }),
  useReadManualNftName: () => ({ data: undefined }),
  useReadManualNftSymbol: () => ({ data: undefined }),
  useReadManualNftTotalSupply: () => ({ data: undefined }),
  useWriteManualNftMint: () => ({
    writeContractAsync: vi.fn(),
    isPending: false,
  }),
}));

vi.mock("@/hooks/useInventory", () => ({
  useInventory: () => ({
    tokens: [],
    isLoading: false,
    error: null,
    fetchInventory: vi.fn(),
  }),
}));

vi.mock("@rainbow-me/rainbowkit", () => ({
  ConnectButton: {
    Custom: ({ children }: { children: (props: any) => React.ReactNode }) =>
      children?.({
        openConnectModal: vi.fn(),
        openAccountModal: vi.fn(),
        account: null,
      }) ?? null,
  },
  RainbowKitProvider: ({ children }: { children: React.ReactNode }) => children,
  darkTheme: () => ({}),
}));

import Home from "@/app/page";

describe("Home page", () => {
  it("renders the connect wallet screen when not connected", async () => {
    render(<Home />);

    // Wait for the mounted effect to fire
    await vi.waitFor(() => {
      expect(screen.getByText("ManualNFT")).toBeInTheDocument();
    });

    expect(screen.getByText("Connect Wallet")).toBeInTheDocument();
    expect(
      screen.getByText(/scratch-built ERC-721/)
    ).toBeInTheDocument();
  });

  it("shows the app title", async () => {
    render(<Home />);

    await vi.waitFor(() => {
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
        "ManualNFT"
      );
    });
  });
});

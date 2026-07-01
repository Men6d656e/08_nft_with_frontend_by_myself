"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useReadManualNftBalanceOf,
  useReadManualNftName,
  useReadManualNftSymbol,
  useReadManualNftTotalSupply,
  useWriteManualNftMint,
} from "@/generated";
import { useInventory, type TokenInfo } from "@/hooks/useInventory";
import {
  uploadToIPFS,
  getProviderLabel,
  getProviderShortLabel,
} from "@/lib/ipfs";

/* -------------------------------------------------------------------------- */
/*  Main Page                                                                 */
/* -------------------------------------------------------------------------- */

export default function Home() {
  const { address, isConnected, chain } = useAccount();

  // Prevent hydration mismatch: server & client must render the same HTML.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Contract address from env (must be set after deployment)
  const contractAddress = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    "0x0000000000000000000000000000000000000000") as `0x${string}`;

  // Read contract metadata
  const { data: contractName } = useReadManualNftName({
    address: contractAddress,
  });
  const { data: contractSymbol } = useReadManualNftSymbol({
    address: contractAddress,
  });
  const { data: totalSupply } = useReadManualNftTotalSupply({
    address: contractAddress,
  });

  // Asset creation state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // IPFS upload status
  const [isUploadingIPFS, setIsUploadingIPFS] = useState(false);
  const ipfsProvider = getProviderLabel();

  // Toast state
  const [toast, setToast] = useState<{
    type: "success" | "error" | "pending";
    message: string;
  } | null>(null);

  const { writeContractAsync: mintToken, isPending: isMinting } =
    useWriteManualNftMint();

  // Combined loading state: uploading to IPFS OR waiting for wallet tx
  const isMintingOrUploading = isMinting || isUploadingIPFS;

  // Inventory state
  const {
    tokens: inventory,
    isLoading: isLoadingInventory,
    fetchInventory,
  } = useInventory();
  const [showInventory, setShowInventory] = useState(false);

  // Token count
  const { data: userBalance, refetch: refetchBalance } =
    useReadManualNftBalanceOf({
      address: contractAddress,
      args: [address ?? "0x"],
      query: { enabled: !!address },
    });

  /* ------------------------------------------------------------------------ */
  /*  HANDLERS                                                                */
  /* ------------------------------------------------------------------------ */

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      // Reset the input value so selecting the same file re-triggers the event
      e.target.value = "";
      loadImage(file);
    },
    []
  );

  const loadImage = useCallback((file: File) => {
    setSelectedFile(file);
    // Read as base64 data URL so it persists on-chain (blob URLs are ephemeral)
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) {
        loadImage(file);
      }
    },
    [loadImage]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const clearAssetForm = useCallback(() => {
    setTitle("");
    setDescription("");
    setSelectedFile(null);
    setPreviewUrl(null);
  }, []);

  const handleMint = useCallback(async () => {
    if (!address || !title || !selectedFile) return;

    try {
      // Step 1: Upload the image to IPFS
      setIsUploadingIPFS(true);
      setToast({
        type: "pending",
        message: `Uploading image to ${ipfsProvider}...`,
      });

      const { uri: imageUri } = await uploadToIPFS(selectedFile);

      setToast({
        type: "pending",
        message: `Image uploaded (${imageUri}). Confirm the transaction in your wallet...`,
      });

      // Step 2: Build metadata with the ipfs:// image URI and encode as base64 on-chain
      const metadata = JSON.stringify({
        name: title,
        description: description || "No description",
        image: imageUri,
      });
      const uri = `data:application/json;base64,${btoa(metadata)}`;

      // Step 3: Mint the token with the metadata URI
      setIsUploadingIPFS(false);
      const tx = await mintToken({
        address: contractAddress,
        args: [address, uri],
      });

      setToast({
        type: "success",
        message: `✨ Minted! Tx: ${tx.slice(0, 10)}...${tx.slice(-6)}`,
      });
      clearAssetForm();
      setTimeout(() => {
        refetchBalance();
        fetchInventory();
      }, 2000);
    } catch (err: unknown) {
      setIsUploadingIPFS(false);
      const msg = err instanceof Error ? err.message : "Transaction rejected";
      setToast({ type: "error", message: `✕ ${msg}` });
    }
  }, [
    address,
    title,
    description,
    selectedFile,
    ipfsProvider,
    mintToken,
    contractAddress,
    clearAssetForm,
    refetchBalance,
    fetchInventory,
  ]);

  // Auto-dismiss toast after 5s
  useEffect(() => {
    if (!toast || toast.type === "pending") return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  /* ------------------------------------------------------------------------ */
  /*  RENDER: Hydration-safe initial state                                    */
  /* ------------------------------------------------------------------------ */

  if (!mounted) {
    return <div className="flex flex-col flex-1 min-h-screen bg-[#0a0a0f]" />;
  }

  /* ------------------------------------------------------------------------ */
  /*  RENDER: Wallet Not Connected                                            */
  /* ------------------------------------------------------------------------ */

  if (!isConnected || !address) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center min-h-screen bg-[#0a0a0f] px-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="space-y-4">
            {/* Animated logo */}
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25 animate-in">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
                />
              </svg>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              ManualNFT
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto">
              A scratch-built ERC-721 dApp — no OpenZeppelin, no
              dependencies, just raw Solidity. Connect your wallet to get
              started.
            </p>
          </div>

          <div className="flex justify-center">
            <ConnectButton.Custom>
              {({ openConnectModal }) => (
                <button
                  onClick={openConnectModal}
                  className="group inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/40 active:scale-[0.97]"
                >
                  <svg
                    className="w-5 h-5 transition-transform group-hover:scale-110"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                    />
                  </svg>
                  Connect Wallet
                </button>
              )}
            </ConnectButton.Custom>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50" />
              Anvil Local
            </span>
            <span className="text-slate-700">·</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500/50" />
              Sepolia Testnet
            </span>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------------ */
  /*  RENDER: Connected Dashboard                                             */
  /* ------------------------------------------------------------------------ */

  const chainName = chain?.name ?? "Unknown";
  const isAnvil = chain?.id === 31337;

  return (
    <div className="flex flex-col flex-1 min-h-screen bg-[#0a0a0f]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#1e1b2e] bg-[#0a0a0f]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <svg
                className="w-5 h-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">
                {contractName ?? "ManualNFT"}
              </h2>
              <span className="text-[10px] font-mono text-slate-500">
                {contractSymbol ?? "MNFT"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                isAnvil
                  ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isAnvil ? "bg-emerald-400" : "bg-amber-400"
                }`}
              />
              {chainName}
            </span>

            <ConnectButton.Custom>
              {({ account, openAccountModal }) => (
                <button
                  onClick={openAccountModal}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#1e1b2e] hover:bg-[#2e2a4a] border border-[#3b3b5c] text-xs text-slate-300 transition-all"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                  {account?.displayName ?? address.slice(0, 6)}
                </button>
              )}
            </ConnectButton.Custom>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <StatCard
            label="Total Supply"
            value={totalSupply?.toString() ?? "0"}
          />
          <StatCard
            label="Your Balance"
            value={userBalance?.toString() ?? "0"}
          />
          <StatCard label="Network" value={chainName} />
          <StatCard
            label="Account"
            value={`${address.slice(0, 6)}...${address.slice(-4)}`}
            mono
          />
        </div>

        {/* Action Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-[#1e1b2e] border border-[#3b3b5c] w-fit mb-8">
          <button
            onClick={() => setShowInventory(false)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              !showInventory
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:text-white hover:bg-[#2e2a4a]"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Create & Mint
          </button>
          <button
            onClick={() => setShowInventory(true)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              showInventory
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "text-slate-400 hover:text-white hover:bg-[#2e2a4a]"
            }`}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            Inventory
          </button>
        </div>

        {/* Content */}
        {!showInventory ? (
          <AssetCreationForm
            title={title}
            description={description}
            previewUrl={previewUrl}
            selectedFile={selectedFile}
            fileInputRef={fileInputRef}
            isDragOver={isDragOver}
            isMinting={isMintingOrUploading}
            toast={toast}
            canMint={!!title && !!selectedFile && !isMintingOrUploading}
            isUploadingIPFS={isUploadingIPFS}
            ipfsProvider={getProviderShortLabel()}
            onTitleChange={setTitle}
            onDescriptionChange={setDescription}
            onFileSelect={handleFileSelect}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClear={clearAssetForm}
            onMint={handleMint}
            onDismissToast={() => setToast(null)}
            contractSymbol={contractSymbol ?? "MNFT"}
          />
        ) : (
          <InventoryPanel
            tokens={inventory}
            isLoading={isLoadingInventory}
            balance={Number(userBalance ?? 0)}
            onFetch={fetchInventory}
          />
        )}
      </main>

      <footer className="border-t border-[#1e1b2e] py-4">
        <p className="text-center text-xs text-slate-600">
          Built with Foundry · Next.js · Wagmi · RainbowKit
        </p>
      </footer>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                            */
/* -------------------------------------------------------------------------- */

function StatCard({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#1e1b2e] border border-[#3b3b5c] p-4 space-y-1 transition-all hover:border-indigo-500/30 hover:bg-[#211e36]">
      <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">
        {label}
      </p>
      <p
        className={`text-lg font-semibold text-white ${
          mono ? "font-mono text-sm tracking-tight" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Asset Creation Form                                                       */
/* -------------------------------------------------------------------------- */

function AssetCreationForm({
  title,
  description,
  previewUrl,
  selectedFile,
  fileInputRef,
  isDragOver,
  isMinting,
  isUploadingIPFS,
  ipfsProvider,
  toast,
  canMint,
  contractSymbol,
  onTitleChange,
  onDescriptionChange,
  onFileSelect,
  onDrop,
  onDragOver,
  onDragLeave,
  onClear,
  onMint,
  onDismissToast,
}: {
  title: string;
  description: string;
  previewUrl: string | null;
  selectedFile: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  isDragOver: boolean;
  isMinting: boolean;
  isUploadingIPFS: boolean;
  ipfsProvider: string;
  toast: { type: "success" | "error" | "pending"; message: string } | null;
  canMint: boolean;
  contractSymbol: string;
  onTitleChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  onClear: () => void;
  onMint: () => void;
  onDismissToast: () => void;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-5">
      {/* Left Column — Form Fields */}
      <div className="lg:col-span-3 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Create & Mint</h3>
          <p className="text-sm text-slate-400 mt-1">
            Fill in the details and your NFT will be minted on-chain. Images
            are uploaded to IPFS and referenced via <code className="text-indigo-400 text-[11px]">ipfs://</code> URIs.
          </p>
        </div>

        <div className="rounded-xl bg-[#1e1b2e] border border-[#3b3b5c] p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Cosmic Dreamscape #1"
              className="w-full px-4 py-3 rounded-lg bg-[#0a0a0f] border border-[#3b3b5c] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Describe what makes this NFT special..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg bg-[#0a0a0f] border border-[#3b3b5c] text-white text-sm placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">
              Image <span className="text-red-400">*</span>
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={`
                relative flex flex-col items-center justify-center h-44 rounded-xl border-2 border-dashed cursor-pointer
                transition-all duration-200 group
                ${
                  isDragOver
                    ? "border-indigo-400 bg-indigo-500/10"
                    : selectedFile
                    ? "border-emerald-500/40 bg-emerald-500/5"
                    : "border-[#3b3b5c] bg-[#0a0a0f] hover:border-indigo-500/50 hover:bg-indigo-500/5"
                }
              `}
            >
              {selectedFile && previewUrl ? (
                <div className="relative w-full h-full">
                  <img
                    src={previewUrl}
                    alt="Uploaded"
                    className="w-full h-full object-cover rounded-lg"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f]/80 via-transparent to-transparent rounded-lg" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2">
                    <span className="text-xs text-white/90 bg-black/50 px-2 py-1 rounded-md truncate max-w-[70%]">
                      {selectedFile.name}
                    </span>
                    <span className="text-[10px] text-white/70 bg-black/50 px-2 py-1 rounded-md">
                      {(selectedFile.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClear();
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white/70 hover:text-white hover:bg-black/80 flex items-center justify-center transition-all"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="text-center px-6">
                  <svg
                    className={`w-10 h-10 mx-auto mb-3 transition-colors ${
                      isDragOver
                        ? "text-indigo-400"
                        : "text-slate-600 group-hover:text-indigo-400"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm text-slate-500 group-hover:text-slate-400 transition-colors">
                    {isDragOver
                      ? "Drop your image here"
                      : "Drag & drop or click to browse"}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1">
                    PNG, JPG, GIF · max 1MB recommended
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
                onChange={onFileSelect}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onMint}
            disabled={!canMint}
            className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all ${
              canMint
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/40 active:scale-[0.97]"
                : "bg-[#2e2a4a] text-slate-500 cursor-not-allowed"
            }`}
          >
            {isMinting ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                {isUploadingIPFS
                  ? `Uploading to ${ipfsProvider}...`
                  : "Confirm in wallet..."}
              </>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v6m3-3H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Mint Token
              </>
            )}
          </button>

          {title && (
            <button
              onClick={onClear}
              disabled={isMinting}
              className="px-5 py-3.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-[#2e2a4a] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear
            </button>
          )}
        </div>

        {/* Transaction Toast */}
        {toast && (
          <div
            className={`flex items-start gap-3 p-4 rounded-xl border transition-all animate-in ${
              toast.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20"
                : toast.type === "error"
                ? "bg-red-500/10 border-red-500/20"
                : "bg-amber-500/10 border-amber-500/20"
            }`}
          >
            <span
              className={`mt-0.5 text-lg ${
                toast.type === "success"
                  ? "text-emerald-400"
                  : toast.type === "error"
                  ? "text-red-400"
                  : "text-amber-400"
              }`}
            >
              {toast.type === "success"
                ? "✓"
                : toast.type === "error"
                ? "✕"
                : "⏳"}
            </span>
            <p
              className={`flex-1 text-sm ${
                toast.type === "success"
                  ? "text-emerald-300"
                  : toast.type === "error"
                  ? "text-red-300"
                  : "text-amber-300"
              }`}
            >
              {toast.message}
            </p>
            <button
              onClick={onDismissToast}
              className="text-slate-500 hover:text-white transition-colors shrink-0"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Right Column — NFT Preview Card */}
      <div className="lg:col-span-2">
        <label className="block text-xs font-medium text-slate-400 mb-1.5">
          Live Preview
        </label>
        <div className="rounded-xl bg-[#1e1b2e] border border-[#3b3b5c] overflow-hidden sticky top-24">
          {/* Preview Image */}
          <div className="aspect-square bg-gradient-to-br from-[#1a1740] to-[#0a0a0f] flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={title || "NFT Preview"}
                className="w-full h-full object-cover transition-all duration-300"
              />
            ) : (
              <div className="text-center p-8">
                <svg
                  className="w-16 h-16 mx-auto text-slate-700"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                  />
                </svg>
                <p className="mt-3 text-xs text-slate-600">
                  Upload an image to see the preview
                </p>
              </div>
            )}
          </div>

          {/* Preview Details */}
          <div className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                {contractSymbol}
              </span>
            </div>
            {title ? (
              <h4 className="text-base font-semibold text-white truncate">
                {title}
              </h4>
            ) : (
              <h4 className="text-base font-semibold text-slate-600 italic">
                Untitled
              </h4>
            )}
            {description ? (
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {description}
              </p>
            ) : (
              <p className="text-xs text-slate-700 italic">
                No description
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Inventory Panel                                                           */
/* -------------------------------------------------------------------------- */

function InventoryPanel({
  tokens,
  isLoading,
  balance,
  onFetch,
}: {
  tokens: TokenInfo[];
  isLoading: boolean;
  balance: number;
  onFetch: () => void;
}) {
  return (
    <div className="rounded-xl bg-[#1e1b2e] border border-[#3b3b5c] p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Inventory</h3>
          <p className="text-sm text-slate-400 mt-1">
            {balance} token{balance !== 1 ? "s" : ""} owned
          </p>
        </div>
        <button
          onClick={onFetch}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#2e2a4a] text-white text-sm font-medium transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.97] disabled:cursor-not-allowed disabled:shadow-none"
        >
          <svg
            className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182"
            />
          </svg>
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {tokens.length === 0 && !isLoading && (
        <div className="text-center py-16">
          <svg
            className="w-14 h-14 mx-auto text-slate-700"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="mt-4 text-sm text-slate-500">
            No tokens yet. Head over to{" "}
            <span className="text-indigo-400 font-medium">Create & Mint</span>{" "}
            to mint your first one!
          </p>
        </div>
      )}

      {tokens.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tokens.map((token) => (
            <div
              key={token.id}
              className="group rounded-xl bg-[#0a0a0f] border border-[#3b3b5c] overflow-hidden hover:border-indigo-500/40 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300"
            >
              {/* Token Image */}
              <div className="aspect-square bg-gradient-to-br from-[#1a1740] to-[#0a0a0f] flex items-center justify-center overflow-hidden">
                {token.metadata?.image ? (
                  <img
                    src={token.metadata.image}
                    alt={token.metadata.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="text-center">
                    <span className="text-5xl">🖼️</span>
                    <p className="text-[10px] text-slate-600 mt-2">
                      No image data
                    </p>
                  </div>
                )}
              </div>

              {/* Token Details */}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                    #{token.id}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white truncate">
                  {token.metadata?.name ?? `Token #${token.id}`}
                </p>
                {token.metadata?.description && (
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {token.metadata.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex items-center gap-3 text-slate-400">
            <svg
              className="animate-spin h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-sm">Loading your inventory...</span>
          </div>
        </div>
      )}
    </div>
  );
}

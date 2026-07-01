import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Web3Providers } from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ManualNFT | Custom ERC-721 dApp",
  description:
    "A production-grade dApp featuring a scratch-built ERC-721 NFT contract and a Next.js frontend with WalletConnect integration.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">
        <Web3Providers>{children}</Web3Providers>
      </body>
    </html>
  );
}

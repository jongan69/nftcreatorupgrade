'use client';

import "./globals.css";
// import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-wallets";
import "@solana/wallet-adapter-react-ui/styles.css";
import { Toaster } from "react-hot-toast";
import { useMemo } from "react";

const HELIUS_RPC_URL = `https://mainnet.helius-rpc.com/?api-key=${process.env.NEXT_PUBLIC_HELIUS_API_KEY}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallets = useMemo(() => [new PhantomWalletAdapter()], []);
  return (
    <html lang="en">
      <head>
        <script src="assets/js/jquery.min.js" defer />
        <script src="assets/js/popper.min.js" defer />
        <script src="assets/js/bootstrap.min.js" defer />
        <script src="assets/js/swiper-bundle.min.js" defer />
        <script src="assets/js/countto.js" defer />
        <script src="assets/js/simpleParallax.min.js" defer />
        <script src="assets/js/gsap.js" defer />
        <script src="assets/js/SplitText.js" defer />
        <script src="assets/js/wow.min.js" defer />
        <script src="assets/js/ScrollTrigger.js" defer />
        <script src="assets/js/gsap-animation.js" defer />
        <script src="assets/js/tsparticles.min.js" defer />
        <script src="assets/js/main.js" defer />
      </head>
      <body>
        <ConnectionProvider endpoint={HELIUS_RPC_URL}>
          <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
              {children}
              <Toaster />
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </body>
    </html>
  );
}
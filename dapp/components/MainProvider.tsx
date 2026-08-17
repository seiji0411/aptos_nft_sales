"use client";

import {AptosWalletAdapterProvider} from "@aptos-labs/wallet-adapter-react";
import {Toaster} from "@/components/ui/toaster";
import {ThemeProvider} from "@/components/theme-provider";
import {PetraWallet} from "petra-plugin-wallet-adapter";
import {MartianWallet} from "@martianwallet/aptos-wallet-adapter";
import {PontemWallet} from "@pontem/wallet-adapter-plugin";
import {TrustWallet} from "@trustwallet/aptos-wallet-adapter";
import {OKXWallet} from "@okwallet/aptos-wallet-adapter";


// List of supported wallets to be used by the AptosWalletAdapterProvider below.
//
// NOTE: Each wallet is a plugin that implements the Aptos wallet standard.
const wallets = [new PetraWallet(), new MartianWallet(), new PontemWallet(), new TrustWallet(), new OKXWallet()];

export function MainProvider(props: { children: React.ReactNode }) {
  return (
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AptosWalletAdapterProvider plugins={wallets} autoConnect={true}>
          {props.children}
          <Toaster />
        </AptosWalletAdapterProvider>
      </ThemeProvider>
  )
}
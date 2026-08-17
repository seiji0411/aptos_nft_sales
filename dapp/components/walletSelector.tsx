"use client";

import {WalletReadyState, useWallet, Wallet} from "@aptos-labs/wallet-adapter-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {RefObject, useEffect, useRef, useState} from "react";
import Image from "next/image";
import {AptosClient} from "aptos";

/* 
  Component that displays a button to connect a wallet. If the wallet is connected, it displays the 
  wallet's APT balance, address and a button to disconnect the wallet. 

  When the connect button is clicked, a dialog is displayed with a list of all supported wallets. If 
  a supported wallet is installed, the user can click the connect button to connect the wallet. If
  the wallet is not installed, the user can click the install button to install the wallet.
*/

const client = new AptosClient(process.env.NEXT_PUBLIC_RPC_NODE_URL as string);

export default function WalletSelector(
  props: {
    isTxnInProgress?: boolean;
    trigger?: boolean;
  }
) {

  // wallet state variables 
  const { connect, account, connected, disconnect, wallets, isLoading } = useWallet();
  // State to hold the current account's APT balance. In string - floating point format.
  const [balance, setBalance] = useState<string | undefined>(undefined);
  const btnRef: any = useRef<HTMLButtonElement>();

  useEffect(() => {
    if (btnRef && btnRef.current) {
      (btnRef.current as HTMLButtonElement).click();
    }
  }, [props.trigger]);
  /* 
    Gets the balance of the connected account whenever the connected, account, and isTxnInProgress
    variables change.
  */
  useEffect(() => {
    if (connected && account) {
      getBalance(account.address);
    }
  }, [connected, account, props.isTxnInProgress]);

  /*
    Gets the balance of the given address. In case of an error, the balance is set to 0. The balance
    is returned in floating point format.
    @param address - The address to get the APT balance of.
  */
  const getBalance = async (address: string) => {
    /* 

      TODO #3: Make a call to the 0x1::coin::balance function to get the balance of the given address. 
      
      HINT: 
        - The APT balance is return with a certain number of decimal places. Remember to convert the 
          balance to floating point format as a string.
        - Remember to make the API request in a try/catch block. If there is an error, set the 
          balance to "0".

    */
    const payload = {
      function:
          "0x1::coin::balance",
      type_arguments: ["0x1::aptos_coin::AptosCoin"],
      arguments: [address],
    };

    let balance = 0;
    try {
      const res = await client.view(payload);
      balance = Number(res[0])
    } catch (e) {
      setBalance("0");
      return;
    }

    setBalance((balance / 100000000).toLocaleString());
  };

  return (
    <div>
      {!connected && !isLoading && (
        <Dialog>
          <DialogTrigger>
            <button type="button" ref={btnRef} className="text-white border border-aptosgreen rounded-md px-6 py-2">Connect Wallet</button>
          </DialogTrigger>
          <DialogContent style={{ overflow: "hidden" }}>
            <DialogHeader>
              <DialogTitle>Connect your wallet</DialogTitle>
            </DialogHeader>
            <div className="mt-4">
              {
                wallets.map((wallet: Wallet) => (
                    <div
                        key={wallet.name}
                        className="flex w-fulls items-center justify-between rounded-xl p-2"
                    >
                      <div className="flex items-center gap-2">
                        <Image src={wallet.icon} alt={wallet.name} width={32} height={32}/>
                        <h1>{wallet.name}</h1>
                      </div>
                      {
                        wallet.readyState === WalletReadyState.Installed &&
                        <Button variant="secondary" onClick={() => connect(wallet.name)}>
                          Connect
                        </Button>
                      }
                      {
                        wallet.readyState === WalletReadyState.NotDetected &&
                          <a href={wallet.url} target="_blank">
                            <Button variant="secondary">
                              Install
                            </Button>
                          </a>
                      }
                    </div>
                ))
              }
            </div>
          </DialogContent>
        </Dialog>
      )}
      {
          isLoading &&
          <button className="secondary text-white border border-aptosgreen rounded-md px-6 py-2" disabled>
            Loading...
          </button>
      }
      {
        props.isTxnInProgress &&
          <button className="secondary text-white border border-aptosgreen rounded-md px-6 py-2" disabled>
            Processing...
          </button>
      }
      {
        !props.isTxnInProgress && connected && account &&
          <div>
            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button className="font-mono text-white border border-aptosgreen rounded-md px-6 py-2">
                  {balance ?? "_"} APT | {account.address.slice(0, 5)}...{account.address.slice(-4)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => disconnect()}>
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
      }
    </div>
  );
}

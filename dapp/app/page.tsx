"use client";

import {useWallet} from "@aptos-labs/wallet-adapter-react";
import WalletSelector from "../components/walletSelector";
import {Separator} from "@/components/ui/separator";
import {AlertCircle, AlertTriangle, Ban, Clipboard, Unplug} from "lucide-react";
import React, {useEffect, useState} from "react";
import Image from "next/image";
import NFTCard from "@/components/NFTCard";
import {CollectionInfo, FAQ} from "@/lib/types";
import Faq from "@/components/Faq";
import {toast} from "@/components/ui/use-toast";
import {
    createReferralPayload, getMintPricePayload,
    getReferralPayload,
    mintNFTPayload,
} from "@/lib/aliens";
import {AptosClient} from "aptos";
import {useSearchParams, useRouter} from "next/navigation";
import NFTSelector from "@/components/NFTSelector";
import {COLLECTION_LINK_STRING, COLLECTIONS} from "@/lib/collections";
import {sleep} from "@/lib/utils";
import {NETWORK} from "@/lib/constants";

const faqs: FAQ[] = [
    {
        title: "What are Aptos Aliens?",
        content: "Aptos Aliens makes the experience of minting Aptos NFTs accessible, convenient and affordable.<br/>" +
            "<br/>" +
            "Season One of Aptos Aliens involves 50 different NFT collections. Minting NFTs contributes to your leaderboard status and will qualify you to receive spot prizes in addition to other future benefits and potential airdrops.",
    },
    {
        title: "Smart Contract Details",
        content: "You can review and interact directly with our smart contracts here:<br/>" +
            "<br/>" + COLLECTION_LINK_STRING()
    },
    {
        title: "Why do I need to approve each transaction separately rather than in one batch?",
        content: "Each NFT is a separate collection with its own smart contract and so must be approved separately.",
    }
];

const client = new AptosClient(process.env.NEXT_PUBLIC_RPC_NODE_URL as string);

declare global {
    interface Window {
        martian: any;
        aptos: any;
        pontem: any;
        trustwallet: any;
        okxwallet: any;
    }
}

export default function Home() {
    const searchParams = useSearchParams();
    const page_referral = searchParams.get('referral');
    const router = useRouter();
    // wallet state variables
    const {connected, isLoading, network, account, wallet} = useWallet();
    // State to indicate if a transaction is in progress. Used to disable and refresh components.
    const [txnInProgress, setTxnInProgress] = useState(false);
    // State to indicate if the connected account exists on Network. Used to display an error message.
    const [accountExists, setAccountExists] = useState<Boolean>(true);
    const [selectedCollections, setSelectedCollections] = useState<Array<string>>([]);
    const [referral, setReferral] = useState("");
    const [collections, setCollections] = useState<Array<CollectionInfo>>(COLLECTIONS);
    const [referralLink, setReferralLink] = useState<string | null>(null);
    const [mintPrice, setMintPrice] = useState(0.1);
    const [openDropdown, setOpenDropdown] = useState(false);
    const [trigger, setTrigger] = useState(false);

    const loadMintPrice = async () => {
        const res: Array<any> = await client.view(getMintPricePayload());
        console.log(res)
        if (res.length > 0) {
            setMintPrice(Number(res[0]) / 10 ** 8);
        }
    }

    useEffect(() => {
        loadMintPrice();
    }, []);

    const loadAccountReferral = async (account_address: string) => {
        const res: Array<any> = await client.view(getReferralPayload(account_address));

        if (res[0].vec.length > 0) {
            setReferralLink(`${res[0].vec[0]}`);
        } else {
            setReferral("");
            setReferralLink(null);
        }
    }

    /*
      Checks if the connected account exists whenever the connected and account variables change.
    */
    useEffect(() => {
        checkIfAccountExists();
        // console.log(connected, account);
        if (connected && account) {
            loadAccountReferral(account.address);
        }
    }, [connected, account])

    const checkIfAccountExists = async () => {
        setAccountExists(connected && !!account);
    }

    const onSelectNft = (collection: CollectionInfo, selected: boolean) => {
        if (selected) {
            setSelectedCollections([...selectedCollections, collection.collection_address]);
        } else {
            setSelectedCollections(selectedCollections.filter((n) => n !== collection.collection_address))
        }
    }

    const onChangeSelected = (nftCount: number) => {
        if (nftCount == 0) {
            return setSelectedCollections([]);
        }
        let counter = selectedCollections.length;
        let newSelected = Object.assign([], selectedCollections);
        if (counter < nftCount) {
            // increase
            for (const collection of collections) {

                if (!newSelected.includes(collection.collection_address)) {
                    counter++;
                    newSelected.push(collection.collection_address);

                    if (counter >= nftCount) {
                        break;
                    }
                }
            }
        } else if (counter > nftCount) {
            // decrease
            while (counter != nftCount) {
                newSelected = newSelected.slice(0, -1);
                counter--;
            }
        }

        setSelectedCollections(newSelected);
    }

    // mint only one NFT
    const onMint = async (collection: CollectionInfo) => {
        if (!checkConnection()) {
            return;
        }

        setTxnInProgress(true);

        const referrer = page_referral ?? "";
        const collection_address = collection.collection_address;

        const mint_payload = mintNFTPayload(collection_address, referrer);
        let txnHash = await signAndSubmitTransaction(mint_payload);

        if (txnHash) {
            await sleep(2000);
            verifyTransaction(txnHash).then((success) => {
                if (success) {
                    toast({
                        title: <div className="flex items-center gap-2 text-aptosgreen"><AlertCircle className="h-4 w-4"/>
                            <div>NFT minted!</div>
                        </div>,
                        description: <div className="text-aptosgreen">Transaction succeed</div>
                    });
                }
                setTxnInProgress(false);
            });
        } else {
            setTxnInProgress(false);
        }
    }

    const verifyTransaction = async (txHash: string) => {
        const tx: any = await client.getTransactionByHash(txHash);
        if (!tx.success) {
            toast({
                title: <div className="flex items-center gap-2 text-red-500"><Ban className="h-4 w-4"/>
                    <div>Failed transaction!</div>
                </div>,
                description: <div className="text-red-500">Please try later.</div>
            });
            return false;
        }
        return true;
    }

    // mint selected NFTs
    const onMintSelected = async () => {
        if (!checkConnection()) {
            return;
        }

        if (!selectedCollections.length) {
            toast({
                title: <div className="flex items-center gap-2 text-yellow-500"><AlertTriangle className="h-4 w-4"/>
                    <div>Info</div>
                </div>,
                description: <div className="text-yellow-500">Please select collections!</div>
            });
        }

        setTxnInProgress(true);

        for (const collection of selectedCollections) {
            const referrer = page_referral ?? "";
            const mint_payload = mintNFTPayload(collection, referrer);

            let txnHash = await signAndSubmitTransaction(mint_payload);

            if (txnHash) {
                await sleep(2000);
                verifyTransaction(txnHash).then((success) => {
                    if (success) {
                        toast({
                            title: <div className="flex items-center gap-2 text-aptosgreen"><AlertCircle
                                className="h-4 w-4"/>
                                <div>NFT minted!</div>
                            </div>,
                            description: <div className="text-aptosgreen">Transaction succeed</div>
                        });
                    }
                });
            }
        }
        setSelectedCollections([])
        setTxnInProgress(false);
    }

    const signAndSubmitTransaction = async (txn: any) => {
        let txnHash = null;

        try {
            if (wallet?.name == "Martian" && window?.martian) {
                const transaction = await window.martian.generateTransaction(
                    account?.address,
                    txn
                );

                const signedTxn = await window.martian.signTransaction(transaction);

                const submitted = await window.martian.submitTransaction(signedTxn);
                if (submitted) {
                    txnHash = submitted.hash;
                }
            } else if (wallet?.name == "Petra" && window?.aptos) {
                const submitted = await window.aptos.signAndSubmitTransaction(
                    {payload: txn}
                );
                if (submitted) {
                    txnHash = submitted.hash;
                }
            } else if (wallet?.name == "Pontem" && window?.pontem) {
                const submitted = await window.pontem.signAndSubmit(
                    txn
                );

                if (submitted.success) {
                    txnHash = submitted.result.hash;
                }
            } else if (wallet?.name == "TrustWallet" && window?.trustwallet && window?.trustwallet.aptos) {
                const submitted = await window.trustwallet.aptos.signAndSubmitTransaction(
                    txn
                );
                if (submitted) {
                    txnHash = submitted.hash;
                }
            } else if (wallet?.name == "OKX Wallet" && window?.okxwallet && window?.okxwallet.aptos) {
                const submitted = await window.okxwallet.aptos.signAndSubmitTransaction(
                    txn
                );
                if (submitted) {
                    txnHash = submitted.hash;
                }
            }
        } catch (e) {
        }

        return txnHash;
    }

    const onCreateReferral = async () => {
        if (!checkConnection()) {
            return;
        }

        const referral_text = referral.trim();
        if (!referral_text || referral_text.length == 0) {
            return toast({
                title: <div className="flex items-center gap-2 text-yellow-500"><AlertTriangle className="h-4 w-4"/>
                    <div>Info</div>
                </div>,
                description: <div className="text-yellow-500">Please insert referral code!</div>
            });
        }

        setTxnInProgress(true);

        const create_referral_script = createReferralPayload(referral);
        let txnHash = await signAndSubmitTransaction(create_referral_script);

        if (txnHash) {
            await sleep(2000);
            verifyTransaction(txnHash).then((success) => {
                if (success) {
                    toast({
                        title: <div className="flex items-center gap-2 text-aptosgreen"><AlertCircle className="h-4 w-4"/>
                            <div>Referral link generated!</div>
                        </div>,
                        description: <div className="text-aptosgreen">Transaction succeed</div>
                    });
                    if (account?.address) {
                        loadAccountReferral(account.address)
                    }
                }

                setTxnInProgress(false);
            });
        } else {
            setTxnInProgress(false);
        }
    }

    const checkConnection = () => {
        if (isLoading) {
            return false;
        }

        if (!connected && !isLoading) {
            toast({
                title: <div className="flex items-center gap-2 text-red-500"><Unplug className="h-4 w-4"/>
                    <div>Connect your wallet!</div>
                </div>,
                description: <div className="text-red-500">You need to connect your wallet before you can use this
                    app.</div>
            });
            return false
        }

        if (connected && !isLoading && network?.name.toString().toLowerCase() != NETWORK) {
            toast({
                title: <div className="flex items-center gap-2 text-red-500"><Unplug className="h-4 w-4"/>
                    <div>Switch your network!</div>
                </div>,
                description: <div className="text-red-500">Switch your network to Mainnet to use this app.</div>
            });
            return false
        }

        if (connected && !isLoading && !accountExists && network?.name.toString().toLowerCase() == NETWORK) {
            toast({
                title: <div className="flex items-center gap-2 text-red-500"><Unplug className="h-4 w-4"/>
                    <div>Account not found!</div>
                </div>,
                description: <div className="text-red-500">Please make sure your account is exists on Mainnet and try
                    again.</div>
            });
            return false
        }

        if (txnInProgress) {
            toast({
                title: <div className="flex items-center gap-2 text-red-500"><Unplug className="h-4 w-4"/>
                    <div>Transaction is running now!</div>
                </div>,
                description: <div className="text-red-500">Please try a few seconds later.</div>
            });
            return false
        }

        return true;
    }


    const onCopyReferral = () => {
        const textField = document.createElement('textarea');
        textField.innerText = `https://alienharvesters.com?referral=${referralLink}`;
        document.body.appendChild(textField);
        textField.select();
        document.execCommand('copy');
        textField.remove();

        toast({
            title: <div className="flex items-center gap-2 text-aptosgreen"><Clipboard className="h-4 w-4"/>
                <div>Referral Link Copied!</div>
            </div>,
        });
    }

    const onClickMenu = (path: string) => {
        setOpenDropdown(false);
        router.push(path);
    }

    return (
        <div className="main-container">
            <header className="fixed inset-x-0 top-0 z-50 border-b bg-headerbg border-gray-800">
                <nav className="flex items-center justify-between py-4 px-6 lg:px-8 max-w-7xl left-0 right-0 mx-auto">
                    <div className="flex lg:flex-1"><a className="flex items-center gap-2" href="/">
                        <Image width={48} height={48} src="/logo.png" alt="Logo"/>
                        <span
                            className="text-primary font-semibold text-2xl text-aptosgreen">Alien Harvesters</span></a>
                    </div>
                    <div className="flex lg:hidden">
                        {
                            !openDropdown ?
                                <button type="button" className="-m-2.5 rounded-md p-2.5 text-gray-400"
                                        onClick={() => setOpenDropdown(true)}>
                                    <span className="sr-only">Open main menu</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                         strokeWidth="1.5"
                                         stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-6 w-6">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                              d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"></path>
                                    </svg>
                                </button> :
                                <button type="button" className="-m-2.5 rounded-md p-2.5 text-gray-400"
                                        onClick={() => setOpenDropdown(false)}>
                                    <span className="sr-only">Close menu</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
                                         strokeWidth="1.5"
                                         stroke="currentColor" aria-hidden="true" data-slot="icon" className="h-6 w-6">
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                              d="M6 18 18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                        }
                    </div>
                    <div className="hidden lg:flex lg:gap-x-12 text-white">
                        <a className="group font-semibold leading-6 hover:text-aptosgreen transition duration-300"
                           href="/#MintNFT">
                            Mint NFT
                            <span
                                className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-aptosgreen"></span>
                        </a>
                        <a className="group font-semibold leading-6 hover:text-aptosgreen transition duration-300"
                           href="/#Referral">
                            Referral Program
                            <span
                                className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-aptosgreen"></span>
                        </a>
                        <a className="group font-semibold leading-6 hover:text-aptosgreen transition duration-300"
                           href="/#FAQ">
                            FAQ
                            <span
                                className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-aptosgreen"></span>
                        </a>
                        <div className="font-semibold leading-6 text-gray-500 cursor-default">Leaderboard <span
                            className="px-2 bg-gray-700 rounded-md text-sm">soon</span></div>
                    </div>
                    <div className="hidden lg:flex lg:flex-1 lg:justify-end">
                        <div className="flex flex-row gap-2">
                            {/*<ThemeToggle/>*/}
                            <WalletSelector isTxnInProgress={txnInProgress} trigger={trigger}/>
                        </div>
                    </div>
                </nav>
                {
                    openDropdown &&
                    <div className="flex flex-col lg:hidden lg:gap-x-12 text-white w-full py-2 px-4">
                        <div
                            className="group font-semibold leading-6 hover:text-aptosgreen transition duration-300 py-2"
                            onClick={() => onClickMenu("/#MintNFT")}>
                            Mint NFT
                            <span
                                className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-aptosgreen"></span>
                        </div>
                        <a className="group font-semibold leading-6 hover:text-aptosgreen transition duration-300 py-2"
                           onClick={() => onClickMenu("/#Referral")}>
                            Referral Program
                            <span
                                className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-aptosgreen"></span>
                        </a>
                        <a className="group font-semibold leading-6 hover:text-aptosgreen transition duration-300 py-2"
                           onClick={() => onClickMenu("/#FAQ")}>
                            FAQ
                            <span
                                className="block max-w-0 group-hover:max-w-full transition-all duration-500 h-0.5 bg-aptosgreen"></span>
                        </a>
                        <div className="font-semibold leading-6 text-gray-500 cursor-default py-2">Leaderboard <span
                            className="px-2 bg-gray-700 rounded-md text-sm">soon</span></div>
                    </div>
                }
            </header>

            <Separator/>

            <div className="h-[80px] lg:hidden block"></div>

            <div className="flex lg:hidden justify-end px-4 w-full py-2 mt-2">
                <div className="flex flex-row gap-2">
                    {/*<ThemeToggle/>*/}
                    <WalletSelector isTxnInProgress={txnInProgress}/>
                </div>
            </div>

            <div className="mt-8 lg:mt-24 max-w-6xl mx-auto">
                {/*Mint NFT*/}
                <div className="py-8 lg:py-24 sm:py-32" id="MintNFT">
                    <div className="mx-auto px-4">
                        <div className="mx-auto text-center flex flex-col gap-5 items-start relative">
                            <span
                                className="text-gray-300 text-lg flex items-center gap-2">Powered by
                            <Image
                                alt="Aptos"
                                loading="lazy"
                                width={75}
                                height={25.8}
                                decoding="async"
                                data-nimg="1"
                                src="/aptos-logo-white.svg"/>
                        </span>
                            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-4xl sm:w-3/5 text-left">Begin
                                your cosmic journey and mint
                                <span
                                    className="animate-gradient bg-[length:200%_auto] bg-clip-text text-transparent bg-aptosgreen"> Unique Aptos Aliens</span>
                            </h1>
                            <p className="text-white sm:w-2/5 text-left">
                                Each Aptos Alien is its own contract - minting all 50 will grant you
                                <span className="text-aptosgreen"> 50 contract interactions </span>
                                on-chain.
                            </p>
                        </div>
                    </div>

                    <div
                        className="mt-16 sm:mt-24 px-4 flex justify-end">
                        <NFTSelector selectedCollections={selectedCollections} onChangeSelected={onChangeSelected}
                                     onMintSelected={onMintSelected} total={collections.length} mintPrice={mintPrice}/>
                    </div>
                    <div className="px-4 mt-2 sm:mt-4">
                        <span className="text-white self-end sm:text-lg text-center">Mint individual aliens, or select multiple and click 'Mint Selected'</span>
                    </div>
                    <div
                        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 justify-items-center mt-4 gap-4 lg:gap-8 px-4">
                        {
                            collections.map((collection, key) => <NFTCard key={key} collection={collection}
                                                                          selected={selectedCollections.includes(collection.collection_address)}
                                                                          onSelect={onSelectNft} onMint={onMint}  mintPrice={mintPrice}/>)
                        }
                    </div>
                </div>

                {/*Referral*/}
                <div
                    id="Referral"
                    className={"max-w-7xl flex flex-col items-center pb-24 sm:pb-32 gap-10 mx-auto w-full relative z-30 px-4" + (!connected || !account ? " cursor-pointer" : "")}
                    onClick={() => {
                        if (!connected || !account) {
                            setTrigger(!trigger);
                        }
                    }}
                >
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-4xl">
                        Referral Program
                    </h1>
                    <p className="text-gray-400 text-lg max-w-2xl text-center">Earn a 20% commission on every NFT
                        minted through your referral link, instantly credited to your wallet.</p>
                    <div className="border-white rounded-lg border relative flex items-center justify-between referral-box px-4 py-6 sm:px-8 sm:py-12">
                        <div className="flex items-center gap-3">
                            <Image src="/star.svg" width={80} height={80} alt="start" className="p-0.5 sm:p-2 border-2 border-white rounded-lg w-8 h-8 sm:w-20 sm:h-20" />
                            <div className="flex-grow">
                                <div className="text-lg sm:text-4xl font-bold">20%</div>
                                <div className="text-[8px] sm:text-sm leading-tight">commission form every NFT minted <br/>using your unique referral link</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-grow  text-right">
                                <div className="text-lg sm:text-4xl font-bold">{mintPrice} APT</div>
                                <div className="text-[8px] sm:text-sm leading-tight">Mint price</div>
                            </div>
                            <Image src="/aptos.svg" width={80} height={80} alt="start" className="p-1 sm:p-3 border-2 border-white rounded-lg w-8 h-8 sm:w-20 sm:h-20" />
                        </div>
                    </div>

                    {connected && !isLoading && network?.name.toString().toLowerCase() == NETWORK &&
                        <div className="flex items-center gap-4 sm:gap-8 flex-wrap justify-center">
                            {
                                referralLink ?
                                    <>
                                        <div className="flex items-center gap-8">
                                            <div>
                                                <label htmlFor="referral-code" className="mr-2">Referral Link:</label>
                                                <a href={"/?referral=" + referralLink} target="_blank"
                                                   className="text-[#27e246]">https://alienharvesters.com?referral={referralLink}</a>
                                            </div>
                                        </div>
                                        <button
                                            className="rounded-lg text-white px-3 py-1 sm:px-4 sm:py-2 border border-[#27e246]"
                                            onClick={onCopyReferral}>Copy Referral Link
                                        </button>
                                    </>
                                    :
                                    <>
                                        <label htmlFor="referral-code" className="mr-2">Referral Code</label>
                                        <input
                                            className="rounded-lg bg-neutral-950 text-white px-3 py-2 pl-4 sm:px-4 sm:py-2 border"
                                            name="referral-code" type="text"
                                            value={referralLink ? referralLink : referral}
                                            disabled={!!referralLink}
                                            onChange={(e) => setReferral(e.target.value)}/>
                                        <button
                                            className="rounded-lg text-white px-3 py-2 sm:px-4 sm:py-2 border border-[#27e246]"
                                            onClick={onCreateReferral}>Create Referral Code
                                        </button>
                                    </>
                            }
                        </div>
                    }
                </div>

                {/*FAQ*/}
                <div id="FAQ"
                     className="max-w-7xl flex flex-col items-center pb-24 sm:pb-32 gap-10 mx-auto w-full relative z-30 px-4">
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-4xl">Frequently Asked
                        Questions</h1>
                    <div className="mx-auto w-full max-w-4xl divide-y divide-white">
                        <dl className="space-y-6 divide-y divide-white">
                            {
                                faqs.map((f, key) => <Faq key={key} faq={f}/>)
                            }
                        </dl>
                    </div>
                </div>
            </div>

            {/*Footer*/}
            <div className="py-10 px-4 w-full z-30 relative bg-headerbg border-t border-gray-800">
                <div className="items-center gap-6 max-w-7xl w-full mx-auto flex justify-end"><span
                    className="text-gray-400 text-lg">Socials</span>
                    <a className="border border-gray-700 bg-gray-900 px-3 rounded-lg h-12 flex items-center"
                       href="https://twitter.com/AlienHarvesters">
                        <Image
                            alt="AptosAliens Twitter" loading="lazy" width="20" height="20" decoding="async"
                            data-nimg="1"
                            src="/x-logo-white.png"
                        />
                    </a>
                    <a className="border border-gray-700 bg-gray-900 px-2.5 rounded-lg h-12 flex items-center"
                       href="https://t.me/AlienHarvesters">
                        <Image
                            alt="AptosAliens Telegram" loading="lazy" width="24" height="24" decoding="async"
                            data-nimg="1"
                            src="/telegram-logo-white.svg"
                        />
                    </a>
                </div>
            </div>
        </div>
    );
}

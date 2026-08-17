import {AptosAccount, AptosClient} from "aptos";
import {ALIENS} from "../const";

export async function mint_nft(creator: AptosAccount, config: any, client: AptosClient) {
    const collection_name = config['collection_name']
    const referrer = "";
    const create_mint_script = {
        type: "entry_function_payload",
        function: ALIENS + "::candymachine_core::create_alien_nft",
        type_arguments: [],
        arguments: [
            collection_name,
            referrer,
        ],
    };

    let txnRequest = await client.generateTransaction(creator.address(), create_mint_script);
    let bcsTxn = AptosClient.generateBCSTransaction(creator, txnRequest);
    let transactionRes = await client.submitSignedBCSTransaction(bcsTxn);
    let check_txn: any = await client.waitForTransactionWithResult(transactionRes.hash);

    if (check_txn.success) {
        console.log('NFT minted - Transaction Hash: ' + transactionRes.hash)
    }
    return transactionRes.hash
}
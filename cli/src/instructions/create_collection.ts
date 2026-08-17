import {AptosAccount, AptosClient} from "aptos";

export async function create_collection(creator: AptosAccount, config: any, client: AptosClient) {
    const collections = config['collections'];
    console.log(`All collections: ${collections.length}`);

    for (const collection of collections) {
        const collection_address = collection['collection_address'];
        const collection_description = collection['collection_name'];
        const base_token_name = collection['collection_name'] + "_#";
        const token_description = collection['collection_name'];
        const base_uri = collection['base_uri'];
        const total_supply = 2**32 - 1;

        const create_nft_collection = {
            type: "entry_function_payload",
            function: collection_address + "::candymachine_core::init",
            type_arguments: [],
            arguments: [
                collection['collection_name'],
                collection_description,
                collection['collection_uri'],
                total_supply,
                base_uri,
                base_token_name,
                token_description,
            ]
        };

        let txnRequest = await client.generateTransaction(creator.address(), create_nft_collection);
        let bcsTxn = AptosClient.generateBCSTransaction(creator, txnRequest);
        let transactionRes = await client.submitSignedBCSTransaction(bcsTxn);
        let check_txn: any = await client.waitForTransactionWithResult(transactionRes.hash);

        if (check_txn.success) {
            console.log(`Collection ${collection_address} Created - Hash: ` + transactionRes.hash)
        }
    }
}
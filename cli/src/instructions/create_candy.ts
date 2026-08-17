import {AptosAccount, AptosClient} from "aptos";
import {ALIENS, MINT_PRICE, REFERRAL_FEE} from "../const";

export async function create_candy(creator: AptosAccount, client: AptosClient) {
    const create_candy_machine = {
        type: "entry_function_payload",
        function: ALIENS + "::aliens_core::init",
        type_arguments: [],
        arguments: [
            MINT_PRICE,
            REFERRAL_FEE,
            ALIENS
        ]
    };
    let txnRequest = await client.generateTransaction(creator.address(), create_candy_machine);
    let bcsTxn = AptosClient.generateBCSTransaction(creator, txnRequest);
    let transactionRes = await client.submitSignedBCSTransaction(bcsTxn);
    let check_txn: any = await client.waitForTransactionWithResult(transactionRes.hash);

    if (check_txn.success) {
        console.log('Candy Machine Created - Transaction Hash: ' + transactionRes.hash)
    } else {
        console.log(check_txn)
    }
    return transactionRes.hash
}
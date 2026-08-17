import {AptosAccount, AptosClient} from "aptos";
import {ALIENS} from "../const";

export async function withdraw(creator: AptosAccount, client: AptosClient) {
    const withdraw_script = {
        type: "entry_function_payload",
        function: ALIENS + "::aliens_core::withdraw",
        type_arguments: [],
        arguments: [
            "0xef1b1c46e684fd7d589f17471024d93a3bada506227243f472584c551d0347dd",
            0.2 * 100000000,
        ],
    };

    let txnRequest = await client.generateTransaction(creator.address(), withdraw_script);
    let bcsTxn = AptosClient.generateBCSTransaction(creator, txnRequest);
    let transactionRes = await client.submitSignedBCSTransaction(bcsTxn);
    let check_txn: any = await client.waitForTransactionWithResult(transactionRes.hash);

    if (check_txn.success) {
        console.log('Withdraw - Transaction Hash: ' + transactionRes.hash)
    }
    return transactionRes.hash
}
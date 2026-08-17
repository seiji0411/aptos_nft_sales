import {AptosAccount} from "aptos";

export async function generate_key_pair() {
    console.log(`KEYPAIR: \n`)
    for (let i = 0; i < 50; i++) {
        const account = new AptosAccount()
        console.log(`${account.address()}`)
    }
}
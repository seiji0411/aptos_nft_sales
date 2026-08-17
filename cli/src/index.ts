#!/usr/bin/env node
import {AptosClient, AptosAccount, HexString} from "aptos";
import * as fs from "fs"
import {create_candy} from "./instructions/create_candy"
import {program} from "commander"
import {create_collection} from "./instructions/create_collection";
import {mint_nft} from "./instructions/mint_nft";
import {ALIENS, ALIENS_PRIVATE_KEY, CREATOR_PRIVATE_KEY, NODE_URL} from "./const";
import {withdraw} from "./instructions/withdraw";
import {generate_key_pair} from "./instructions/generate_key_pair";
import {set_mint_price} from "./instructions/set_mint_price";

program
    .version('0.0.1')
    .description("Aliens candy machine smart contract for Aptos Blockchain.")
    .option('-c, --create_candy', 'candymachine init')
    .option('-p, --set_mint_price', 'update mint price')
    .option('-l, --create_collection', 'create collection')
    .option('-m, --mint_nft', 'mint nft')
    .option('-u, --withdraw', 'withdraw')
    .option('-k, --keypair', 'generate keypair')
    .option('-w, --config', 'config')
    .parse(process.argv);

const options = program.opts();
if (options.create_candy) {
    const client = new AptosClient(NODE_URL);
    const admin = new AptosAccount(HexString.ensure(ALIENS_PRIVATE_KEY).toUint8Array(), undefined);

    create_candy(admin, client).then();
} else if (options.set_mint_price) {
    const client = new AptosClient(NODE_URL);
    const admin = new AptosAccount(HexString.ensure(ALIENS_PRIVATE_KEY).toUint8Array(), undefined);

    set_mint_price(admin, client).then();
} else if (options.create_collection) {
    let argIndex = process.argv.indexOf('--config')

    const config = JSON.parse(fs.readFileSync(process.argv[argIndex + 1], "utf8"));

    const client = new AptosClient(NODE_URL);
    const admin = new AptosAccount(HexString.ensure(ALIENS_PRIVATE_KEY).toUint8Array(), undefined);

    create_collection(admin, config, client).then();
} else if (options.mint_nft) {
    let argIndex = process.argv.indexOf('--config')

    const config = JSON.parse(fs.readFileSync(process.argv[argIndex + 1], "utf8"));

    const client = new AptosClient(NODE_URL);
    const admin = new AptosAccount(HexString.ensure(CREATOR_PRIVATE_KEY).toUint8Array(), undefined);

    mint_nft(admin, config, client).then();
} else if (options.withdraw) {
    const admin = new AptosAccount(HexString.ensure(ALIENS_PRIVATE_KEY).toUint8Array(), undefined);
    const client = new AptosClient(NODE_URL);

    withdraw(admin, client).then();
} else if (options.keypair){

    generate_key_pair().then();
} else {
    program.outputHelp();
}
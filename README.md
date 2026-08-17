# Aptos Aliens
NFT minting dapp on Aptos blockchain

## Deploy smart contracts
- deploy core contract
```
cd contracts/aliens
aptos init
...
aptos move compile
aptos move publish
```

- deploy 50 collections
```
cd contracts/nft_collections
aptos key generate --vanity-prefix 0xae --output-file key --assume-yes
```

Result

    {
        "Result": {
        "Account Address:": "0xaef8699e0864e6b6e766ed5d0e9acaa53f6808ca0dab2c0804dc21d53aced1b4",
        "PublicKey Path": "key.pub",
        "PrivateKey Path": "key"
        }
    }

Testnet faucet
```
aptos account fund-with-faucet --account 0xaef69f8d8789d10b4ccc6ed2d092e60a1ee305b2cfd1d68ba9bcc4efe7b823e6
```

```
aptos move publish --private-key-file key --assume-yes --named-addresses aliens=0xbc134eab7e8ffc402f6ff0d035409f542886a4ae4ce67a290b2ee04a12dfefa1,collection=0xaeeb7a02e771d31cf4972c14c36e4018707699b2b54d8b950509573832c7cb71
```

- create collection
```
cd cli
yarn create_collection --config config.json
```
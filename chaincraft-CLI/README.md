<img src="https://github.com/acgodson/mortywallet/blob/main/public/algo.svg" width="auto" height="45">

# Chaincraft: CLI

Chaincraft CLI is a command line interface that enables users to create or destroy Algorand assets using the JavaScript AlgosDK. With chaincraft, you can effortlessly perform transactions on the Algorand network and manage your assets.

## Features

- Create or Destroy Algorand assets
- Connects with the JavaScript AlgosDK to interact with the Algorand network
- Supports [Arc3]() and [Arc69]() standards
- [chaincraft-auth]() utilizes web3auth & firebase-jwt on browser to create wallet and store keys (Note: This may not be the case in production)

## Requirements

Node.js version 18 or later
npm version 8 or later

## Installation

To install chaincraft CLI, Use:

```bash
npm i chaincraft
```

Or Clone GitHub Repository

```bash
git clone https://github.com/acgodson/chaincraft.git

#  Navigate to bin directory
cd chaincraft/chaincraft-CLI

# Install globally to test from anywhere
npm install -g .
```

## Usage

```bash
 chaincraft  [command] [options]

```

## Options

```bash
      --help         Show help                                                           [boolean]
      --version      Show version number                                                 [boolean]
  -t, --type         choose to "pure nft" or "fractional"
                         [string] [required] [choices: "pure nft", "fractional"]

  -n, --name         Used to derieve unit and asset name, < 8 character length           [string] [required]


  -d, --description  Description for NFT metadata                                        [string]
  -m, --manager      Address permitted to anage asset configuration                      [string]
  -f, --freezer      Address permitted freeze and unfreeze assets                        [string]
  -i, -id            Asset id, required to modify, lookup or destroy asset               [string] [required]

```

## Commands

```bash
create-asset  [type] [name]  [description] [manager]
    create an Algorand asset with specified parameters

destroy [asset-id]
    destroy an Algorand asset

freeze-asset [asset-id]   Freeze or Unfreeze asset on Algorand Blockchain
reauth         Sign in to your chaincraft wallet and overide any existing stored keys

```

## Examples

Create a pure NFT (arc3)

```bash

chaincraft create-asset --type "pure nft" --name "bluesky" --description "my album art cover"

# URL or file-path to image: /Users/godson/Downloads/me. jpeg

# ~ Transaction confirmed; Pure NFT Created Confirmed Round: 27565515
# AssetID: 157587852
# parms: {
# "creator": "6TYVZDYX2IP6GROUSUYTJIQU2WX4G5LBHHXPQSAXVZSVN773HSPMAZYAOQ" ,
# "decimals": 0,
# "default-frozen": false,
# "metadata-hash": "J8F69QtKaakRjpr3YvSqDH10VqtOTTtLpjNaWc/pSTE=",
# "name": "bluesky@arc3"
# "name-b64" : "dGlueWJpcmRAYXJiMw==
# "total": 1,
# "unit-name": "BLUESKY",
# "unit-name-b64": "VElOWUJJUkQ="
# "url": "ipfs://QmR1qizBGy KyPD3nTpUPUHeXMzsekarpJWJ5EM91DkzSC"
# "url-b64": "aXBmczovL1FtUjFxaXpCR31GS31QRDNuVHBVUFVIZVhNenNla2FycEpXSjVFTTkXRG t6UOM="
# }
# Preview NFT

```

![log1](https://github.com/acgodson/chaincraft/blob/main/chaincraft-CLI/screenshots/log1.png)
![log2](https://github.com/acgodson/chaincraft/blob/main/chaincraft-CLI/screenshots/log2.png)

Destroy Asset (asset-id)

```bash

chaincraft destroy-asset 157787208

# {
# Asset destroyed
# 'confirmed-round': 27611290,
# ...

# txn: {
#     caid: 157787208,
#     fee: 1000,
#     fv: 27611287,
#     gen: 'testnet-v1.0'
#     gh: [Uint8Array],
#     1v: 27612287,
#     snd: [Uint8Array],
#     type: 'acfg'

```

![log2](https://github.com/acgodson/chaincraft/blob/main/chaincraft-CLI/screenshots/dst.png)

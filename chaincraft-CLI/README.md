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

To install chaincraft CLI, follow these steps:

- Install Node.js and clone this repository

```bash
git clone https://github.com/acgodson/chaincraft.git

## Navigate to bin directory
cd chaincraft/chaincraft-CLI

##Install Globally
npm install -g .
```

## Usage

```bash
 chaincraft  [command] [options]

```

## Options

```bash
--version             output the version number
--help                output usage information
--type                choose between "pure nft" or "fractional"
--name                unit and asset name is derieved from value
--description         description of file
--manager             address of asset manager
--id                  asset-id

```

## Commands

```bash
create-asset  [type] [name]  [description] [manager]
    create an Algorand asset with specified parameters

destroy [asset-id]
    destroy an Algorand asset

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

![log1](/screenshots/log1.png)
![log2](/screenshots/log2.png)

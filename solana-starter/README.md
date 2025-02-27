# Solana Starter

Solana Starter is a foundational project that provides essential scripts for interacting with the Solana blockchain using the Metaplex and Web3.js libraries. This repository includes utilities for minting tokens, creating NFTs, uploading metadata, and handling token transfers.

## Features
- Connect to Solana Devnet
- Generate and sign transactions using a wallet keypair
- Upload metadata to decentralized storage (Irys)
- Mint SPL tokens and NFTs
- Transfer tokens between accounts

## Prerequisites
Before using this project, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v16 or later recommended)
- [Yarn](https://yarnpkg.com/) or [npm](https://www.npmjs.com/)
- A Solana wallet keypair stored as `Turbin3-wallet.json`
- Solana CLI (optional but recommended)

## Setup
1. Clone the repository:
   ```sh
   git clone https://github.com/solana-turbin3/Q1_25_Builder_AdedejiAdetola.git
   cd solana-starter
   ```

2. Install dependencies:
   ```sh
   yarn install
   ```

3. Ensure you have a valid Solana keypair JSON file named `Turbin3-wallet.json` in the project root.

## Usage

### 1. Upload Metadata to Irys
Run the script to upload JSON metadata to decentralized storage:
```sh
yarn upload-metadata
```

### 2. Mint an NFT
Mint a new NFT using the provided metadata:
```sh
yarn mint-nft
```

### 3. Create an SPL Token
Create an SPL token on Solana Devnet:
```sh
yarn create-token
```

### 4. Create Metadata for a Minted Token
Attach metadata to a minted token:
```sh
yarn create-metadata
```

### 5. Mint Tokens to an Associated Token Account
Mint additional tokens to an ATA:
```sh
yarn mint-to
```

### 6. Transfer Tokens
Transfer tokens to another wallet:
```sh
yarn transfer-token
```

## License
MIT License. Feel free to use and modify this project!

---

This project is part of the Turbin3 Q1 2025 Builders Cohort.


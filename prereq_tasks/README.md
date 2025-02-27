# Turbin3 Prerequisite Tasks

This repository contains prerequisite tasks, these tasks involve working with Solana, interacting with programs, managing keypairs, and performing transactions.

## Features

- Generate Solana keypairs
- Request airdrops for Devnet SOL
- Transfer SOL between accounts
- Convert private keys between Base58 and byte array formats
- Interact with the `Turbin3PrereqProgram`
  - Complete prerequisites by submitting a GitHub username
  - Update prerequisite information

## Setup

### Prerequisites
Ensure you have the following installed:
- Rust and Cargo
- Solana CLI
- Node.js (for JavaScript interactions)
- `solana-sdk`, `solana-client`, and `solana-program` Rust crates
- `@solana/web3.js` NPM package

### Clone Repository
```sh
git clone <repository-url>
cd <repository-folder>
```

### Install Dependencies
For Rust:
```sh
cargo build
```
For JavaScript:
```sh
npm install
```

## Usage

### Keypair Generation
To generate a new Solana keypair:
```sh
cargo test -- --nocapture keygen
```

### Request Airdrop
To request SOL airdrop on Devnet:
```sh
cargo test -- --nocapture airdrop
```
Or using JavaScript:
```sh
node airdrop.js
```

### Transfer SOL
```sh
cargo test -- --nocapture transfer_sol
```

### Convert Private Key Formats
- Convert Base58 to wallet file format:
  ```sh
  cargo test -- --nocapture base58_to_wallet
  ```
- Convert wallet file to Base58 format:
  ```sh
  cargo test -- --nocapture wallet_to_base58
  ```

### Complete Prerequisite on Solana Program
To submit your GitHub username:
```sh
cargo test -- --nocapture complete_prereq
```

## License
MIT License. Feel free to use and modify this project!

## Author
Part of Turbin3 Q1 2025 Builders Cohort Prerequisites


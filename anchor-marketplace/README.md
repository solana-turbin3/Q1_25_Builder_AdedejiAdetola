# Anchor Marketplace

## Overview
The **Anchor Marketplace** is a Solana program built using the Anchor framework. It allows users to list, purchase, and delist NFTs while handling marketplace fees and rewarding users with tokens.

## Features
- **Initialize Marketplace**: Set up the marketplace with an admin and a fee structure.
- **List NFTs**: Users can list their NFTs for sale.
- **Delist NFTs**: Users can remove their listings.
- **Purchase NFTs**: Buyers can purchase listed NFTs, transferring SOL to the seller.
- **Treasury & Rewards System**: A rewards token is minted and managed by the marketplace.

## Deployment Instructions

### Prerequisites
Ensure you have the following installed:
- Rust & Cargo
- Solana CLI
- Anchor framework

### Steps
1. **Build the Program**
   ```sh
   anchor build
   ```
2. **Deploy to Devnet**
   ```sh
   anchor deploy
   ```
3. **Update IDL** (if necessary)
   ```sh
   anchor idl upgrade --provider.cluster devnet --filepath target/idl/anchor_marketplace.json <program_id>
   ```

## Program Instructions

### 1. Initialize Marketplace
```rust
pub fn initialize(ctx: Context<Initialize>, name: String, fee: u16) -> Result<()>
```
- Sets up a new marketplace.
- Requires an admin signer.
- Creates a treasury and a rewards mint.

### 2. List an NFT
```rust
pub fn list(ctx: Context<List>, price: u64) -> Result<()>
```
- Creates a listing account.
- Transfers NFT to the vault.

### 3. Delist an NFT
```rust
pub fn delist(ctx: Context<Delist>) -> Result<()>
```
- Withdraws NFT back to the owner.
- Closes the listing account.

### 4. Purchase an NFT
```rust
pub fn purchase(ctx: Context<Purchase>) -> Result<()>
```
- Transfers SOL from buyer to seller.
- Transfers NFT from vault to buyer.
- Closes the NFT vault account.

## Accounts

### Marketplace Account
Stores marketplace settings like:
- `admin`: Owner of the marketplace.
- `fee`: Transaction fee percentage.

### Listing Account
Stores details of an NFT listing:
- `maker`: Owner of the NFT.
- `mint`: NFT mint address.
- `price`: Sale price in SOL.

## Dependencies
- **Anchor** for Solana smart contract development.
- **Anchor SPL** for token management.

## License
MIT License. Feel free to use and modify this project!

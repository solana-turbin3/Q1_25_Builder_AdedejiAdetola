# Escrow Program (Solana + Anchor)

## Overview
This **Escrow Program** is a smart contract built on Solana using **Anchor**. It facilitates secure token swaps between users without requiring direct trust. The escrow holds tokens from a maker until a taker fulfills the exchange conditions, at which point the tokens are transferred accordingly. If the taker does not fulfill the agreement, the maker can withdraw the tokens.

## Features
- Secure token escrow using **Anchor PDA** (Program Derived Address).
- Supports **Token 2022** and **SPL Token** standard.
- Allows deposit and withdrawal of tokens.
- Ensures correct token swaps by verifying mint addresses.
- Includes fail-safe refund mechanisms.

## Program Architecture

### State Account: `EscrowState`
The program uses an **EscrowState** account to store:
- `maker`: The creator of the escrow.
- `mint_a`: The token type deposited by the maker.
- `mint_b`: The token type expected from the taker.
- `receive_amount`: The amount of `mint_b` required from the taker.
- `seed`: Unique identifier for the escrow instance.
- `bump`: PDA bump seed for security.

## Instructions

### 1. `Make`
This instruction initializes the escrow and deposits `mint_a` tokens into the vault.

#### Accounts:
- `maker` (Signer) → Initiates the escrow.
- `mint_a`, `mint_b` → Token mints.
- `maker_ata_a` → Maker's **ATA** (Associated Token Account) for `mint_a`.
- `escrow` → Escrow state PDA.
- `vault` → Escrow's token account holding `mint_a`.

#### Process:
1. Initializes the `EscrowState` account.
2. Transfers `mint_a` tokens from `maker` to the escrow `vault`.

### 2. `Take`
This instruction allows a **taker** to fulfill the escrow conditions by sending `mint_b` tokens and receiving `mint_a`.

#### Accounts:
- `taker` (Signer) → The person fulfilling the escrow.
- `maker` (SystemAccount) → The original escrow creator.
- `taker_ata_b` → Taker's **ATA** for `mint_b` (tokens they send).
- `taker_ata_a` → Taker's **ATA** for `mint_a` (tokens they receive).
- `maker_ata_b` → Maker's **ATA** for `mint_b` (tokens they receive).
- `vault` → Escrow's token account holding `mint_a`.
- `escrow` → Escrow state PDA.

#### Process:
1. Transfers `mint_b` from `taker` to `maker`.
2. Transfers `mint_a` from `vault` to `taker`.
3. Closes the escrow account after a successful trade.

### 3. `Refund`
If the taker does not fulfill the escrow, the maker can reclaim their tokens.

#### Accounts:
- `maker` (Signer) → The original escrow creator.
- `maker_ata_a` → Maker's **ATA** for receiving `mint_a` back.
- `vault` → Escrow's token account holding `mint_a`.
- `escrow` → Escrow state PDA.

#### Process:
1. Transfers `mint_a` back to the maker.
2. Closes the escrow account.

## Security Considerations
- **PDAs** (Program Derived Addresses) ensure that only the program can control token transfers.
- **Bump seeds** protect against unauthorized withdrawals.
- **Account constraints (`has_one`, `associated_token`)** prevent incorrect token transactions.
- **Explicit authority checks** ensure only authorized users interact with the escrow.

## Dependencies
- [Solana](https://docs.solana.com/)
- [Anchor](https://book.anchor-lang.com/)
- [Token 2022](https://spl.solana.com/token-2022)
- [SPL Token](https://spl.solana.com/token)

## Deployment Steps
1. **Build & Deploy the Program**:
   ```sh
   anchor build
   anchor deploy
   ```
2. **Generate IDL**:
   ```sh
   anchor idl parse --file target/idl/escrow.json
   ```
3. **Create a Client (Optional)**:
   You can integrate this program with a frontend using **@solana/web3.js** and **@project-serum/anchor**.

## Next Steps
- Implement an automated **expiration system** for escrows.
- Add **NFT support** for asset trades.
- Extend **cross-program invocation (CPI)** to integrate with DeFi protocols.

## Conclusion
This **Escrow Program** provides a robust and trustless way to exchange tokens securely on **Solana**, leveraging **Anchor's** powerful framework. Future improvements could include additional safety features, automation, and expanded token support.

---
## License
MIT License. Feel free to use and modify this project!
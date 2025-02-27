# Anchor AMM

## Overview
Anchor AMM is an on-chain Automated Market Maker (AMM) built using the Solana Anchor framework. It provides a decentralized way to swap tokens, provide liquidity, and mint LP tokens based on the **Constant Product Market Maker** formula.

## Features
- **Liquidity Pool Creation**: Initialize AMM pools for token pairs.
- **Token Swapping**: Seamless swaps between supported token pairs.
- **Liquidity Provision**: Deposit tokens to earn LP tokens representing your share of the pool.
- **LP Token Minting**: Automated minting of LP tokens proportional to liquidity provided.

## How It Works
The AMM follows a **constant product curve (x * y = k)** to maintain balanced liquidity pools. When users deposit tokens, they receive LP tokens. Swaps are executed based on available liquidity and slippage tolerance.

## Program Structure
The program is modular and consists of the following key components:

### 1. **Initialization (`initialize.rs`)**
- Creates a new liquidity pool.
- Mints LP tokens.
- Sets the pool's fee and authority parameters.

### 2. **Liquidity Provision (`deposit.rs`)**
- Allows users to deposit token pairs into the pool.
- Mints LP tokens in return for deposits.
- Ensures proper balance maintenance using the constant product formula.

### 3. **Token Swaps (`swap.rs`)**
- Swaps between token pairs using the AMM curve.
- Enforces liquidity constraints to prevent imbalance.

## Deployment Steps
1. **Install Dependencies**:
   ```sh
   anchor build
   anchor deploy
   ```
2. **Initialize a Pool**:
   ```sh
   solana program invoke --account <pool_address> --seed <seed>
   ```
3. **Deposit Liquidity**:
   ```sh
   solana program invoke --account <user_address> --amount <amount>
   ```
4. **Swap Tokens**:
   ```sh
   solana program invoke --account <swap_address> --amount <amount>
   ```

## Future Enhancements
- Dynamic fee adjustments
- More efficient slippage management
- Integration with Serum for advanced trading features

## Contributing
We welcome contributions! Feel free to submit a PR or open an issue.

## License
MIT License. Feel free to use and modify this project!


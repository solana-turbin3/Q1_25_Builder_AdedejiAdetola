# NFT Staking

## Overview
NFT Staking is a Solana-based staking program that allows users to stake their NFTs to earn reward tokens. The system tracks the staking duration and distributes rewards accordingly.

## Features
- **Stake NFTs**: Users can stake NFTs to earn rewards over time.
- **Unstake NFTs**: Users can unstake NFTs and claim accumulated rewards.
- **Claim Rewards**: Users can claim their rewards at any time.
- **Admin Configuration**: The admin sets reward parameters such as points per stake, max stake limit, and freeze period.

## Installation

### Prerequisites
Ensure you have the following installed:
- Rust and Cargo
- Solana CLI
- Anchor framework

### Setup
1. Clone the repository:
   ```sh
   git clone <repository_url>
   cd nft_staking
   ```
2. Install dependencies:
   ```sh
   anchor build
   ```
3. Deploy the program:
   ```sh
   anchor deploy
   ```

## Program Architecture

### Instructions
- **Initialize Config** (`initialize_config`): Sets up staking parameters.
- **Initialize User** (`initialize_user`): Initializes a user account.
- **Stake NFT** (`stake`): Stakes an NFT and locks it.
- **Unstake NFT** (`unstake`): Unstakes an NFT after the required staking period.
- **Claim Rewards** (`claim`): Converts staked time into reward tokens.

### Accounts
- **StakeConfig**: Stores staking configuration settings.
- **UserAccount**: Tracks the staking activity of a user.
- **StakeAccount**: Stores information about staked NFTs.

## Usage

### Initialize Config
```sh
solana program invoke initialize_config --args <points_per_stake> <max_stake> <freeze_period>
```

### Stake NFT
```sh
solana program invoke stake --args <nft_mint_address>
```

### Unstake NFT
```sh
solana program invoke unstake --args <nft_mint_address>
```

### Claim Rewards
```sh
solana program invoke claim
```

## License
MIT License. Feel free to use and modify this project!


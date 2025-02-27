# Vault Program

## Overview
The Vault program is a Solana-based smart contract that provides users with a simple and efficient way to deposit, withdraw, and manage funds within a secure vault. Users can initialize their own vaults, deposit SOL, withdraw funds, and close the vault when no longer needed.

## Features
- **Initialize Vault**: Users can create a vault linked to their wallet.
- **Deposit Funds**: Users can deposit SOL into their vault.
- **Withdraw Funds**: Users can withdraw a specific amount of SOL from their vault.
- **Close Vault**: Users can close their vault, transferring any remaining SOL back to their wallet.

## Deployment Instructions
### Running Locally
To test the Vault program locally, follow these steps:
1. Start a local Solana validator:
   ```sh
   solana-test-validator
   ```
2. Airdrop some SOL for testing:
   ```sh
   solana airdrop 10
   ```
3. Check your balance:
   ```sh
   solana balance
   ```
4. Build the program:
   ```sh
   anchor build
   ```
5. Deploy locally:
   ```sh
   anchor deploy --provider.cluster localnet
   ```
6. Run tests:
   ```sh
   anchor test
   ```

## Instructions & Functions
### **Initialize Vault**
#### Function: `initialize`
- Creates a new vault for the user.
- Stores metadata related to the vault and initializes account states.

### **Deposit Funds**
#### Function: `deposit`
- Transfers SOL from the user’s account into the vault.
- Utilizes Solana’s system program for secure fund transfers.

### **Withdraw Funds**
#### Function: `withdraw`
- Allows users to withdraw a specified amount of SOL from the vault.
- Ensures proper validation and authority checks.
- Prevents overdrawing of vault funds.

### **Close Vault**
#### Function: `close`
- Transfers all remaining funds back to the user.
- Closes the vault and deallocates storage.

## Program ID
```
CvNs41NHygV8xThiws2Ff28FvYuXQDwiGVuLzsDmoKpd
```

## Account Structures
### **VaultState**
```rust
#[account]
pub struct VaultState {
    pub vault_bump: u8,
    pub state_bump: u8,
}
```
- Stores the necessary PDA bump values for reference.

## Security Considerations
- **Signer Validation**: Ensures that only the vault owner can deposit, withdraw, and close the vault.
- **PDA Management**: Uses program-derived addresses (PDAs) to manage funds securely.
- **Balance Checks**: Prevents unauthorized fund withdrawals and ensures correct state transitions.

## Example Usage
### Initialize a Vault
```rust
vault::initialize(ctx)
```
### Deposit 1 SOL
```rust
vault::deposit(ctx, 1_000_000_000)
```
### Withdraw 0.5 SOL
```rust
vault::withdraw(ctx, 500_000_000)
```
### Close Vault
```rust
vault::close(ctx)
```

## Testing
Run the following command to execute the test suite:
```sh
anchor test
```

## Conclusion
The Vault program is a secure and efficient way to manage funds on Solana. It ensures robust fund management while maintaining security and accessibility for users.
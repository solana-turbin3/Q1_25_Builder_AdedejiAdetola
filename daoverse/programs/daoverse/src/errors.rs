use anchor_lang::prelude::*;

// Add these error codes to your error.rs file
#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("String exceeds maximum length")]
    StringTooLong,
    #[msg("Cant update daoverse treasury balance")]
    Overflow,
}

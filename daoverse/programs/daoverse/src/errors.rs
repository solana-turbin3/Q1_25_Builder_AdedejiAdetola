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
    #[msg("Cant update daoverse treasury balance")]
    InsufficientDaoverseTokens,
    #[msg("Invalid Daoverese mint")]
    InvalidDaoverseMint,
    #[msg("Invalid threshold parameters")]
    InvalidThreshold,
    #[msg("Invalid voting period configuration")]
    InvalidVotingPeriod,
    #[msg("Insufficient Dao Tokens")]
    InsufficientDaoTokens,
    #[msg("Invalid Dao mint")]
    InvalidDaoMint,
    #[msg("Voting period has not ended yet")]
    VotingPeriodNotEnded,
    #[msg("Calculation error")]
    CalculationError,
    #[msg("Voting Period Ended")]
    VotingPeriodEnded,
    #[msg("Insufficient Stake")]
    InsufficientStake,
    #[msg("Invalid Voter")]
    InvalidVoter,
    #[msg("Invalid Proposal")]
    InvalidProposal,
    #[msg("Reward Already Claimed")]
    RewardsAlreadyClaimed,
    #[msg("Insufficient Funds")]
    InsufficientFunds,
}

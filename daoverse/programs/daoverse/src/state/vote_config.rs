use anchor_lang::prelude::*;

// Vote type enum
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, InitSpace)]
pub enum VoteType {
    Yes,
    No,
}

// Vote state account
#[account]
#[derive(InitSpace)]
pub struct VoteState {
    pub voter: Pubkey,
    pub proposal_id: Pubkey,
    pub vote_seed: u64, // Make sure this matches the order in your code
    pub bump: u8,
    pub vote_type: VoteType,
    pub tokens_staked: u64,
    pub claimed: bool,
}

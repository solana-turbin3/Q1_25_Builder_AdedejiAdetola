use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct ProposalState {
    pub proposal_seed: u64,
    pub proposal_owner: Pubkey,
    pub bump: u8,

    #[max_len(32)]
    pub proposal_title: String,
    #[max_len(200)]
    pub proposal_details: String,
    pub proposal_cost: u64,
    pub min_token_stake: u64,
    pub vote_count_yes: u64,
    pub vote_count_no: u64,
    pub voting_end_time: i64,
    pub staking_vault_balance: u64,
}

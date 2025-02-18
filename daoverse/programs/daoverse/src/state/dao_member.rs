use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct DaoMemberState {
    pub member_seed: u64,
    pub dao_member: Pubkey,
    pub bump: u8,
    pub created_proposals: u64,
    pub approved_proposals: u64,
    pub total_rewards: u64,
    pub total_votes: u64,
    pub dao_member_balance: u64,
    pub dao_joined: Pubkey,
}

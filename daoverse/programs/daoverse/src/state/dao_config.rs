use anchor_lang::prelude::*;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum GovernanceModel {
    TokenBased,
    ReputationBased,
    Hybrid,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum VotingModel {
    OneTokenOneVote,
    Quadratic,
    WeightedToken,
    HolderBased,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, InitSpace)]
pub enum RewardModel {
    ProportionalDistribution,
    ContributionBased,
    MilestoneBasedVesting,
    NoRewards,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct VotingThreshold {
    pub quorum_percentage: u8,
    pub approval_percentage: u8,
    pub min_voting_period: u64,
    pub max_voting_period: u64,
}

#[account]
#[derive(InitSpace)]
pub struct DaoConfig {
    pub seed: u64,
    pub dao_creator: Pubkey,
    pub dao_mint: Pubkey,
    pub bump: u8,
    pub dao_treasury_balance: u64,
    #[max_len(32)]
    pub creator_name: String,
    #[max_len(200)]
    pub creator_description: String,
    pub total_proposals: u64,
    pub approved_proposals: u64,
    pub governance_model: GovernanceModel,
    pub voting_model: VotingModel,
    pub reward_model: RewardModel,
    pub voting_threshold: VotingThreshold,
}

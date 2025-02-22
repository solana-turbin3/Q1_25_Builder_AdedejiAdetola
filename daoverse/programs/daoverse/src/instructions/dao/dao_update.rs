use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateDao<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,

    #[account(
        mut,
        seeds = [b"dao", creator.key().as_ref(), dao.dao_seed.to_le_bytes().as_ref()],
        bump = dao.bump,
        constraint = dao.dao_creator == creator.key()
    )]
    pub dao: Box<Account<'info, DaoConfig>>,
}

impl<'info> UpdateDao<'info> {
    pub fn update_dao(
        &mut self,
        dao_name: Option<String>,
        dao_description: Option<String>,
        governance_model: Option<dao_config::GovernanceModel>,
        voting_model: Option<dao_config::VotingModel>,
        reward_model: Option<dao_config::RewardModel>,
        voting_threshold: Option<dao_config::VotingThreshold>,
    ) -> Result<()> {
        let dao = &mut self.dao;

        //Enforce that the creator is the dao_creator
        require_keys_eq!(self.creator.key(), dao.dao_creator, ErrorCode::Unauthorized);

        // Update fields if new values are provided
        if let Some(name) = dao_name {
            require!(name.len() <= 32, ErrorCode::StringTooLong);
            dao.dao_name = name;
        }

        if let Some(description) = dao_description {
            require!(description.len() <= 200, ErrorCode::StringTooLong);
            dao.dao_description = description;
        }

        if let Some(governance) = governance_model {
            dao.governance_model = governance;
        }

        if let Some(voting) = voting_model {
            dao.voting_model = voting;
        }

        if let Some(reward) = reward_model {
            dao.reward_model = reward;
        }

        if let Some(threshold) = voting_threshold {
            // Validate threshold parameters
            require!(
                threshold.quorum_percentage <= 100,
                ErrorCode::InvalidThreshold
            );
            require!(
                threshold.approval_percentage <= 100,
                ErrorCode::InvalidThreshold
            );
            require!(
                threshold.min_voting_period <= threshold.max_voting_period,
                ErrorCode::InvalidVotingPeriod
            );

            dao.voting_threshold = threshold;
        }

        Ok(())
    }
}

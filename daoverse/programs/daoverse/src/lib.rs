use anchor_lang::prelude::*;

declare_id!("D11BbTWnpBwXfRC3WibZwkDFhGMdbGxVHWD76DU14eJd");
pub mod state;
pub use state::*;

pub mod instructions;
pub use instructions::*;

pub mod errors;
pub use errors::ErrorCode;

#[program]
pub mod daoverse {
    use super::*;

    //daoverse
    pub fn initialize_daoverse(
        ctx: Context<InitializeDaoverse>,
        dao_creation_fee: u64,
        admin_name: String,
        daoverse_description: String,
        amount: u64,
    ) -> Result<()> {
        ctx.accounts.initialize_daoverse(
            ctx.bumps,
            dao_creation_fee,
            admin_name,
            daoverse_description,
        );

        ctx.accounts.admin_deposit(amount)?;
        Ok(())
    }

    pub fn update_daoverse(
        ctx: Context<UpdateDaoverse>,
        dao_creation_fee: Option<u64>,
        admin_name: Option<String>,
        daoverse_description: Option<String>,
    ) -> Result<()> {
        ctx.accounts
            .update_daoverse(dao_creation_fee, admin_name, daoverse_description)?;

        Ok(())
    }

    //dao
    pub fn initialize_dao(
        ctx: Context<CreateDao>,
        dao_seed: u64,
        amount: u64,
        creator_name: String,
        creator_description: String,
        governance_model: dao_config::GovernanceModel,
        voting_model: dao_config::VotingModel,
        reward_model: dao_config::RewardModel,
        voting_threshold: dao_config::VotingThreshold,
    ) -> Result<()> {
        // Validate creator has sufficient tokens
        ctx.accounts.validate_creator()?;

        // Pay daoverse fee
        ctx.accounts.pay_daoverse_fee()?;

        // Initialize DAO
        ctx.accounts.create_dao(
            ctx.bumps,
            dao_seed,
            creator_name,
            creator_description,
            governance_model,
            voting_model,
            reward_model,
            voting_threshold,
        );

        //Dao creator deposit
        ctx.accounts.dao_creator_deposit(amount)?;

        Ok(())
    }

    pub fn update_dao(
        ctx: Context<UpdateDao>,
        creator_name: Option<String>,
        creator_description: Option<String>,
        governance_model: Option<dao_config::GovernanceModel>,
        voting_model: Option<dao_config::VotingModel>,
        reward_model: Option<dao_config::RewardModel>,
        voting_threshold: Option<dao_config::VotingThreshold>,
    ) -> Result<()> {
        ctx.accounts.update_dao(
            creator_name,
            creator_description,
            governance_model,
            voting_model,
            reward_model,
            voting_threshold,
        )?;

        Ok(())
    }

    //dao member
    pub fn initialize_member(ctx: Context<InitializeMember>, member_seed: u64) -> Result<()> {
        // Validate member has sufficient tokens
        ctx.accounts.validate_member()?;

        // Initialize member state
        ctx.accounts.initialize_member(ctx.bumps, member_seed);

        // Set initial balance
        ctx.accounts.update_member_balance()?;

        Ok(())
    }

    pub fn update_member(
        ctx: Context<UpdateMember>,
        created_proposals: Option<u64>,
        approved_proposals: Option<u64>,
        total_rewards: Option<u64>,
        total_votes: Option<u64>,
    ) -> Result<()> {
        ctx.accounts.update_member(
            created_proposals,
            approved_proposals,
            total_rewards,
            total_votes,
        )?;

        Ok(())
    }
}

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
}

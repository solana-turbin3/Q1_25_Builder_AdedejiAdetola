use anchor_lang::prelude::*;

declare_id!("D11BbTWnpBwXfRC3WibZwkDFhGMdbGxVHWD76DU14eJd");
pub mod state;
pub use state::*;

pub mod instructions;
pub use instructions::*;

#[program]
pub mod daoverse {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>, dao_creation_fee: u64) -> Result<()> {
        ctx.accounts.initialize_config(ctx.bumps, dao_creation_fee);
        Ok(())
    }
}

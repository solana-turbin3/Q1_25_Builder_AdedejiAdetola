use anchor_lang::prelude::*;

declare_id!("D11BbTWnpBwXfRC3WibZwkDFhGMdbGxVHWD76DU14eJd");

#[program]
pub mod daoverse {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

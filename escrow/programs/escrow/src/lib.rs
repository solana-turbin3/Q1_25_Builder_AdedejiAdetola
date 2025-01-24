use anchor_lang::prelude::*;


declare_id!("GGh1P9eyRV7q5zByFGiNeQK99J5QtneXEkyxbqNMt1TR");

pub mod state;
pub use state::*;

pub mod instructions;
pub use instructions::*;

#[program]
pub mod escrow {
    use super::*;

    pub fn make(ctx: Context<Make>, seed:u64, receive_amount: u64, deposit_amount: u64) -> Result<()> {
        ctx.accounts.init_excrow_state(seed, receive_amount, ctx.bumps)?;
        
        ctx.accounts.deposit(deposit_amount)?;
        
        Ok(())
    }
}

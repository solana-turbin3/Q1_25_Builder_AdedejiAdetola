use crate::state::DaoverseConfig;
use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    // admin
    #[account(mut)]
    pub admin: Signer<'info>,
    pub daoverse_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init,
        payer = admin,
        space = 8 + DaoverseConfig::INIT_SPACE,
        seeds = [b"daoverse_config".as_ref()],
        bump
    )]
    pub daoverse_config: Account<'info, DaoverseConfig>,

    // daoverse treasury
    #[account(
        init,
        payer = admin,
        associated_token::mint = daoverse_mint,
        associated_token::authority = daoverse_config,
    )]
    pub daoverse_treasury: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> InitializeConfig<'info> {
    pub fn initialize_config(&mut self, bumps: InitializeConfigBumps, dao_creation_fee: u64) {
        self.daoverse_config.set_inner(DaoverseConfig {
            admin: self.admin.key(),
            daoverse_mint: self.daoverse_mint.key(),
            dao_creation_fee,
            bump: bumps.daoverse_config,
            daoverse_treasury_balance: 0,
        });
    }
}

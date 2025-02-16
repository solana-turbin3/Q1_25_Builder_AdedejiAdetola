use crate::state::DaoverseConfig;
use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
pub struct InitializeDaoverse<'info> {
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

impl<'info> InitializeDaoverse<'info> {
    pub fn initialize_daoverse(
        &mut self,
        bumps: InitializeDaoverseBumps,
        dao_creation_fee: u64,
        admin_name: String,
        daoverse_description: String,
    ) {
        self.daoverse_config.set_inner(DaoverseConfig {
            admin: self.admin.key(),
            daoverse_mint: self.daoverse_mint.key(),
            dao_creation_fee,
            bump: bumps.daoverse_config,
            daoverse_treasury_balance: 0,
            admin_name,
            daoverse_description,
        });
    }

    pub fn update_daoverse(
        &mut self,
        new_dao_creation_fee: Option<u64>,
        new_admin_name: Option<String>,
        new_daoverse_description: Option<String>,
    ) -> Result<()> {
        // Update dao creation fee if provided
        if let Some(fee) = new_dao_creation_fee {
            self.daoverse_config.dao_creation_fee = fee;
        }

        // Update admin name if provided
        if let Some(name) = new_admin_name {
            require!(name.len() <= 32, ErrorCode::StringTooLong);
            self.daoverse_config.admin_name = name;
        }

        // Update daoverse description if provided
        if let Some(description) = new_daoverse_description {
            require!(description.len() <= 200, ErrorCode::StringTooLong);
            self.daoverse_config.daoverse_description = description;
        }

        // Update treasury balance
        self.daoverse_config.daoverse_treasury_balance = self.daoverse_treasury.amount;

        Ok(())
    }
}

// Add these error codes to your error.rs file
#[error_code]
pub enum ErrorCode {
    #[msg("Unauthorized access")]
    Unauthorized,
    #[msg("String exceeds maximum length")]
    StringTooLong,
}

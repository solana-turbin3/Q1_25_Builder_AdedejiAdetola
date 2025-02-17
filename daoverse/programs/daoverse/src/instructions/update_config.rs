use crate::errors::ErrorCode;
use crate::state::DaoverseConfig;

use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenAccount, TokenInterface};

#[derive(Accounts)]
pub struct UpdateDaoverse<'info> {
    // Only admin can update
    #[account(
        address = daoverse_config.admin @ ErrorCode::Unauthorized
    )]
    pub admin: Signer<'info>,

    // Config account - no init since it exists
    #[account(
        mut,
        seeds = [b"daoverse_config".as_ref()],
        bump = daoverse_config.bump,
    )]
    pub daoverse_config: Account<'info, DaoverseConfig>,

    pub daoverse_mint: InterfaceAccount<'info, Mint>,

    // Treasury - no init since it exists
    #[account(
        mut,
        associated_token::mint = daoverse_mint,
        associated_token::authority = daoverse_config,
    )]
    pub daoverse_treasury: InterfaceAccount<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> UpdateDaoverse<'info> {
    pub fn update_daoverse(
        &mut self,
        dao_creation_fee: Option<u64>,
        admin_name: Option<String>,
        daoverse_description: Option<String>,
    ) -> Result<()> {
        // Update dao creation fee if provided
        if let Some(fee) = dao_creation_fee {
            self.daoverse_config.dao_creation_fee = fee;
        }

        // Update admin name if provided
        if let Some(name) = admin_name {
            require!(name.len() <= 32, ErrorCode::StringTooLong);
            self.daoverse_config.admin_name = name;
        }

        // Update daoverse description if provided
        if let Some(description) = daoverse_description {
            require!(description.len() <= 200, ErrorCode::StringTooLong);
            self.daoverse_config.daoverse_description = description;
        }

        // Update treasury balance
        self.daoverse_config.daoverse_treasury_balance = self.daoverse_treasury.amount;

        Ok(())
    }
}

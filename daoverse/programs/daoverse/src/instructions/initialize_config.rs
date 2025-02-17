use crate::errors::ErrorCode;
use crate::state::DaoverseConfig;
use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
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

    //admin ata
    #[account(
        mut,
        associated_token::mint=daoverse_mint,
        associated_token::authority=admin,
    )]
    pub admin_ata: InterfaceAccount<'info, TokenAccount>,

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

    pub fn admin_deposit(&mut self, amount: u64) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = TransferChecked {
            from: self.admin_ata.to_account_info(),
            mint: self.daoverse_mint.to_account_info(),
            to: self.daoverse_treasury.to_account_info(),
            authority: self.admin.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer_checked(cpi_ctx, amount, self.daoverse_mint.decimals)?;

        // Update treasury balance in DaoverseConfig
        self.daoverse_config.daoverse_treasury_balance = self
            .daoverse_config
            .daoverse_treasury_balance
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;

        Ok(())
    }
}

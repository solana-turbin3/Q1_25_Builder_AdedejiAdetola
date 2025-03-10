use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

#[derive(Accounts)]
#[instruction(dao_seed: u64)]

pub struct CreateDao<'info> {
    //dao creator
    #[account(mut)]
    pub creator: Signer<'info>,
    pub daoverse_mint: Box<InterfaceAccount<'info, Mint>>,
    pub dao_mint: Box<InterfaceAccount<'info, Mint>>,

    //dao
    #[account(
        init,
        payer = creator,
        space= 8 + DaoConfig::INIT_SPACE,
        seeds=[b"dao", creator.key().as_ref(), dao_seed.to_le_bytes().as_ref()],
        bump,
    )]
    pub dao: Box<Account<'info, DaoConfig>>,

    //dao treasury - vault
    #[account(
        init,
        payer = creator,
        associated_token::mint = dao_mint,
        associated_token::authority = dao,
    )]
    pub dao_treasury: Box<InterfaceAccount<'info, TokenAccount>>,

    //dao creator ata dao mint
    #[account(
        mut,
        associated_token::mint=dao_mint,
        associated_token::authority=creator,
    )]
    pub creator_dao_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    //daoverse - authority of daoverse treasury
    #[account(
        mut,
        has_one = daoverse_mint,
        seeds = [b"daoverse".as_ref()],
        bump = daoverse.bump
    )]
    pub daoverse: Box<Account<'info, DaoverseConfig>>,

    //daoverse treasury - for paying daoverse fee
    #[account(
        mut,
        associated_token::mint=daoverse_mint,
        associated_token::authority=daoverse
    )]
    pub daoverse_treasury: Box<InterfaceAccount<'info, TokenAccount>>,

    //dao creator ata for daoverse mint
    #[account(
        mut,
        associated_token::mint=daoverse_mint,
        associated_token::authority=creator,
    )]
    pub creator_daoverse_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> CreateDao<'info> {
    //validate dao creator
    //to validate, creator_daoverse_ata amount is greater than 1000
    pub fn validate_creator(&self) -> Result<()> {
        if self.creator_daoverse_ata.mint != self.daoverse_mint.key() {
            return err!(ErrorCode::InvalidDaoverseMint);
        }
        if self.creator_daoverse_ata.amount < 1000 {
            return err!(ErrorCode::InsufficientDaoverseTokens);
        }
        Ok(())
    }

    //pay daoverse fee
    //daoverse fee is 500
    pub fn pay_daoverse_fee(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = TransferChecked {
            from: self.creator_daoverse_ata.to_account_info(),
            mint: self.daoverse_mint.to_account_info(),
            to: self.daoverse_treasury.to_account_info(),
            authority: self.creator.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer_checked(cpi_ctx, 500, self.daoverse_mint.decimals)?;

        // Update daoverse treasury balance
        self.daoverse.daoverse_treasury_balance = self
            .daoverse
            .daoverse_treasury_balance
            .checked_add(500)
            .ok_or(ErrorCode::Overflow)?;

        Ok(())
    }

    //create dao
    //initialize dao
    pub fn create_dao(
        &mut self,
        bumps: CreateDaoBumps,
        dao_seed: u64,
        dao_name: String,
        dao_description: String,
        governance_model: dao_config::GovernanceModel,
        voting_model: dao_config::VotingModel,
        reward_model: dao_config::RewardModel,
        voting_threshold: dao_config::VotingThreshold,
    ) {
        self.dao.set_inner(DaoConfig {
            dao_seed,
            dao_creator: self.creator.key(),
            dao_mint: self.dao_mint.key(),
            bump: bumps.dao,
            dao_treasury_balance: 0,
            dao_name,
            dao_description,
            total_proposals: 0,
            approved_proposals: 0,
            member_count: 0,
            governance_model,
            voting_model,
            reward_model,
            voting_threshold,
        });
    }

    pub fn dao_creator_deposit(&mut self, amount: u64) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = TransferChecked {
            from: self.creator_dao_ata.to_account_info(),
            mint: self.dao_mint.to_account_info(),
            to: self.dao_treasury.to_account_info(),
            authority: self.creator.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer_checked(cpi_ctx, amount, self.daoverse_mint.decimals)?;

        // Update treasury balance in DaoverseConfig
        self.dao.dao_treasury_balance = self
            .dao
            .dao_treasury_balance
            .checked_add(amount)
            .ok_or(ErrorCode::Overflow)?;

        Ok(())
    }
}

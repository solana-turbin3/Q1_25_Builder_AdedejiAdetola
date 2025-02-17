use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

#[derive(Accounts)]
#[instruction(seed: u64)]

pub struct CreateDao<'info> {
    //dao creator
    #[account(mut)]
    pub creator: Signer<'info>,
    pub daoverse_mint: InterfaceAccount<'info, Mint>,
    pub dao_mint: InterfaceAccount<'info, Mint>,

    //dao
    #[account(
        init,
        payer = creator,
        space= 8 + DaoConfig::INIT_SPACE,
        seeds=[b"dao", creator.key.as_ref(), seed.to_le_bytes().as_ref()],
        bump,

    )]
    pub dao: Account<'info, DaoConfig>,

    //dao treasury - vault
    #[account(
        init,
        payer = creator,
        associated_token::mint = dao_mint,
        associated_token::authority = dao,
    )]
    pub dao_treasury: InterfaceAccount<'info, TokenAccount>,

    //dao creator ata dao mint
    #[account(
        mut,
        associated_token::mint=dao_mint,
        associated_token::authority=creator,
    )]
    pub creator_dao_ata: InterfaceAccount<'info, TokenAccount>,

    //dao creator ata for daoverse mint
    #[account(
        mut,
        associated_token::mint=daoverse_mint,
        associated_token::authority=creator,
    )]
    pub creator_daoverse_ata: InterfaceAccount<'info, TokenAccount>,

    //daoverse - authority of daoverse treasury
    #[account(
        mut,
        has_one=daoverse_mint,
        seeds = [b"daoverse".as_ref()],
        bump = daoverse.bump
    )]
    pub daoverse: Account<'info, DaoverseConfig>,

    //daoverse treasury - for paying daoverse fee
    #[account(
        associated_token::mint=daoverse_mint,
        associated_token::authority=daoverse
    )]
    pub daoverse_treasury: InterfaceAccount<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
}

//validate dao creator
//pay daoverse fee
//create dao

//initialize and send tokens to vault

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{close_account, CloseAccount},
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::EscrowState;

#[derive(Accounts)] //defines the account context

pub struct Take<'info> {
    //we initially need signer and mints
    #[account(mut)]
    pub taker: Signer<'info>,

    #[account(mut)]
    pub maker: SystemAccount<'info>, //why is maker a system account //how do we ensure the maker is the correct account when we are using the system account
    pub mint_a: InterfaceAccount<'info, Mint>, //interface account allows you to accept token from  normal program and a token 2022 program
    pub mint_b: InterfaceAccount<'info, Mint>, //why do we need mint_b here?

    //so hema said, we need the two mints here because we would be using (transferring) both of them in the take instruction

    //below we need the taker's ata because we need to we need to transfer from the vault to the taker's ata
    #[account(
        associated_token::mint=mint_b,
        associated_token::authority=taker,
    )]
    pub taker_ata_b: InterfaceAccount<'info, TokenAccount>, //we are transferring token b from the taker to the maker, but if that is the case, we are receiving token a from the escrow, and that means we should have taker_ata_a since we have maker_ata_b defined in line 33, which is for receiving token b

    #[account(
        init_if_needed,
        payer=taker,
        associated_token::mint=mint_a,
        associated_token::authority=taker,
    )]
    pub taker_ata_a: InterfaceAccount<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer=taker,
        associated_token::mint=mint_b,
        associated_token::authority=maker,
    )]
    pub maker_ata_b: InterfaceAccount<'info, TokenAccount>,

    //below, we write data to our escrow
    //below is a data account
    #[account(
        mut,
        close=taker, //after token has been transferred, we would not need the escrow 
        has_one=mint_b, //why mint_b and mint_a?
        has_one=mint_a, //prolly to ensure the correct tokens are being interacted with... recall that the constraints are being used on the data account
        has_one=maker,
        seeds=[b"escrow", escrow.maker.to_bytes().as_ref(), escrow.seed.to_le_bytes().as_ref()],
        bump=escrow.bump,
    )]
    pub escrow: Account<'info, EscrowState>,

    //escrow state has to have a token account of its own (because escrow state cannot store tokens)
    //it will also hold mint_a token, because we want to transfer it from mint_a_ata to the vault
    //escrowState (or escrow) needs its own token account which we call vault, escrow can only store sol and not tokens
    //the vault here is an ata

    //initializing token account for escrow
    #[account(
        associated_token::mint=mint_a,
        associated_token::authority=escrow,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    //3 programs below
    pub system_program: Program<'info, System>, //creating pda
    pub associated_token_program: Program<'info, AssociatedToken>, //creating associated token account
    pub token_program: Interface<'info, TokenInterface>, //transferring tokens from maker (mint_a_ata) to escrow (vault)
}

impl<'info> Take<'info> {
    pub fn withdraw(&mut self) -> Result<()> {
        //transfer from taker to maker token b
        let cpi_program = self.token_program.to_account_info(); //we are using token progam here instead of system_program because we are transferring tokens and not sol
                                                                //does this mean that we can transfer

        let cpi_accounts = TransferChecked {
            from: self.taker_ata_b.to_account_info(),
            mint: self.mint_b.to_account_info(),
            to: self.maker_ata_b.to_account_info(),
            authority: self.taker.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer_checked(cpi_ctx, self.escrow.receive_amount, self.mint_b.decimals)?;

        //Transfer TOKEN from vault to taker

        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = TransferChecked {
            from: self.vault.to_account_info(),
            mint: self.mint_a.to_account_info(),
            to: self.taker_ata_a.to_account_info(),
            authority: self.escrow.to_account_info(),
        };

        let seed_binding = self.escrow.seed.to_le_bytes();

        let maker_binding = self.escrow.maker.to_bytes();

        let bump_binding = self.escrow.bump;

        let seeds: [&[u8]; 4] = [b"escrow", &seed_binding, &maker_binding, &[bump_binding]];

        let signer_seeds: &[&[&[u8]]] = &[&seeds];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, &signer_seeds);

        transfer_checked(cpi_ctx, self.vault.amount, self.mint_a.decimals)?;

        Ok(())
    }

    pub fn close(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = CloseAccount {
            authority: self.escrow.to_account_info(),
            account: self.vault.to_account_info(),
            destination: self.taker.to_account_info(),
        };

        let seed_binding = self.escrow.seed.to_le_bytes();

        let maker_binding = self.escrow.maker.to_bytes();

        let bump_binding = self.escrow.bump;

        let seeds: [&[u8]; 4] = [b"escrow", &seed_binding, &maker_binding, &[bump_binding]];

        let signer_seeds: &[&[&[u8]]] = &[&seeds];

        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, &signer_seeds);

        close_account(cpi_ctx)?;

        Ok(())
    }
}

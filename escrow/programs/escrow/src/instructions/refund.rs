//initialize and send tokens to vault

use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{close_account, CloseAccount},
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

use crate::EscrowState;

#[derive(Accounts)] //defines the account context

pub struct Refund<'info> {
    //we initially need signer and mints
    #[account(mut)]
    pub maker: Signer<'info>,
    pub mint_a: InterfaceAccount<'info, Mint>,
    pub mint_b: InterfaceAccount<'info, Mint>,
    #[account(
        mut,
        associated_token::mint=mint_a,
        associated_token::authority=maker,
    )]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>,

    #[account(
        mut,
        close=maker,
        has_one=mint_a,
        has_one=mint_b,
        seeds=[b"escrow", maker.key.as_ref(), escrow.seed.to_le_bytes().as_ref()],
        bump=escrow.bump,
    )]
    pub escrow: Account<'info, EscrowState>,

    #[account(
        mut,
        associated_token::mint=mint_a,
        associated_token::authority=escrow,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    //3 programs below
    pub system_program: Program<'info, System>, //creating pda
    pub associated_token_program: Program<'info, AssociatedToken>, //creating associated token account
    pub token_program: Interface<'info, TokenInterface>, //transferring tokens from escrow (vault) to maker (mint_a_ata)
}

impl<'info> Refund<'info> {
    pub fn withdraw(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info(); //we are using token progam here instead of system_program because we are transferring tokens and not sol
                                                                //does this mean that we can transfer

        let cpi_accounts = TransferChecked {
            to: self.maker_ata_a.to_account_info(),
            mint: self.mint_a.to_account_info(),
            from: self.vault.to_account_info(),
            authority: self.maker.to_account_info(), //why is the maker the authority and not the escrow? the maker is authority because it is the initial depositor of the token, the escrow only has authority to transfer from the vault if a certain condition is met and this condition is specified in an instruction
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);

        transfer_checked(cpi_ctx, self.vault.amount, self.mint_a.decimals)?;

        Ok(())
    }

    pub fn close(&mut self) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();

        let cpi_accounts = CloseAccount {
            authority: self.escrow.to_account_info(),
            account: self.vault.to_account_info(),
            destination: self.maker.to_account_info(),
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

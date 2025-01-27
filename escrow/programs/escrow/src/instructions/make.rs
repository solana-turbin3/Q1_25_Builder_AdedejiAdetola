//initialize and send tokens to vault

use anchor_lang::prelude::*;
use anchor_spl::{associated_token::AssociatedToken, token_interface::{Mint, TokenAccount, TokenInterface, TransferChecked, transfer_checked}};

use crate::EscrowState;

#[derive(Accounts)] //defines the account context
#[instruction(seed: u64)] //allows you access your instruction arguments in your accounts struct

pub struct Make<'info>{
    //we initially need signer and mints
    #[account(mut)]
    pub maker: Signer<'info>,
    pub mint_a: InterfaceAccount<'info, Mint>, //interface account allows you to accept token from  normal program and a token 2022 program
    pub mint_b: InterfaceAccount<'info, Mint>, //why do we need mint_b here?

    //probably because we need to initialize them in both accounts

    //below we store the mint in the associated token account of the maker
    #[account(
        mut,
        associated_token::mint=mint_a,
        associated_token::authority=maker,
    )]
    pub maker_ata_a: InterfaceAccount<'info, TokenAccount>,

    //below, we write data to our escrow
    //below is a data account
    #[account(
        init,
        payer=maker,
        space= 8 + EscrowState::INIT_SPACE,
        seeds=[b"escrow", maker.key().as_ref(), seed.to_le_bytes().as_ref()],
        bump,
    )]
    pub escrow: Account<'info, EscrowState>,

    //escrow state has to have a token account of its own (because escrow state cannot store tokens)
    //it will also hold mint_a token, because we want to transfer it from mint_a_ata to the vault
    //escrowState (or escrow) needs its own token account which we call vault, escrow can only store sol and not tokens
    //the vault here is an ata

    //initializing token account for escrow

    #[account(
        init,
        payer=maker,
        associated_token::mint=mint_a,
        associated_token::authority=escrow,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    //3 programs below
    pub system_program: Program<'info, System>, //creating pda
    pub associated_token_program: Program<'info, AssociatedToken>, //creating associated token account
    pub token_program: Interface<'info, TokenInterface>, //transferring tokens from maker (mint_a_ata) to escrow (vault) 

}

impl<'info> Make<'info> {
    pub fn init_excrow_state(
        &mut self,
        seed: u64,
        receive_amount: u64,
        bumps: MakeBumps, //why makebumps?
    ) -> Result<()> {

        //hema said, all structs have set_inner by defauly

        self.escrow.set_inner(EscrowState {
            seed,
            receive_amount,
            maker: self.maker.key(),
            mint_a: self.mint_a.key(),
            mint_b: self.mint_b.key(),
            bump: bumps.escrow //why bumps.escrow?
        });
        Ok(())
    }

    pub fn deposit(&mut self, amount:u64) -> Result<()> {
        let cpi_program = self.token_program.to_account_info(); //we are using token progam here instead of system_program because we are transferring tokens and not sol
        //does this mean that we can transfer 


        let cpi_accounts= TransferChecked{
            from: self.maker_ata_a.to_account_info(),
            mint:self.mint_a.to_account_info(),
            to:self.vault.to_account_info(),
            authority: self.maker.to_account_info()
        };

        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        
        
        transfer_checked(cpi_ctx, amount, self.mint_a.decimals)?;
        
        Ok(())
    }
}


use anchor_lang::{prelude::*, system_program::{transfer, Transfer}};

declare_id!("CvNs41NHygV8xThiws2Ff28FvYuXQDwiGVuLzsDmoKpd");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        // msg!("Greetings from: {:?}", ctx.program_id);
        ctx.accounts.initialize(ctx.bumps)?;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount:u64) -> Result<()> {
        
        ctx.accounts.deposit(amount)?;
        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount:u64) -> Result<()> {
        
        ctx.accounts.withdraw(amount)?;
        Ok(())
    }
}

#[account]
#[derive(InitSpace)]
pub struct VaultState {
    pub vault_bump: u8,
    pub state_bump: u8,
}

//we use VaultState because it is computationally heavy

#[derive(Accounts)]
pub struct Initialize<'info> {

    #[account(mut)]
    pub signer: Signer<'info>, //payer that is one of the reasons it is mutable
    #[account(
        init,
        payer=signer,
        space=VaultState::INIT_SPACE+8,
        seeds = [b"state", signer.key().as_ref()],
        bump
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        seeds = [vault_state.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>

}

impl<'info> Initialize<'info> {
    pub fn initialize(&mut self, bumps: InitializeBumps) -> Result<()> {
        self.vault_state.vault_bump = bumps.vault;
        self.vault_state.state_bump = bumps.vault_state;
        Ok(())
    }
} //save bumps to state



#[derive(Accounts)]
pub struct Deposit<'info> {

    #[account(mut)]
    pub signer: Signer<'info>, //payer that is one of the reasons it is mutable
    #[account(
        seeds = [b"state", signer.key().as_ref()],
        bump = vault_state.state_bump,
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        seeds = [vault_state.key().as_ref()],
        bump = vault_state.vault_bump
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>

}

impl<'info> Deposit<'info> {
    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        let system_program = self.system_program.to_account_info();

        let accounts = Transfer{
            from: self.signer.to_account_info(),
            to: self.vault.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(system_program, accounts);

        transfer(cpi_ctx, amount)?;
        Ok(())
    }
} 

#[derive(Accounts)]
// #[instruction(amount: u64)]
pub struct Withdraw<'info> {

    #[account(mut)]
    pub signer: Signer<'info>, 
    #[account(
        seeds = [b"state", signer.key().as_ref()],
        bump = vault_state.state_bump,
    )]
    pub vault_state: Account<'info, VaultState>,

    #[account(
        seeds = [vault_state.key().as_ref()],
        bump = vault_state.vault_bump
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>

}


impl<'info> Withdraw<'info> {
    pub fn withdraw(&mut self, amount: u64) -> Result<()> {
        let system_program = self.system_program.to_account_info();

        let accounts = Transfer{
            from: self.vault.to_account_info(),
            to: self.signer.to_account_info(),
        };

        let cpi_ctx = CpiContext::new(system_program, accounts);
        assert!(self.vault.lamports() >= amount);

        transfer(cpi_ctx, amount)?;
        Ok(())
    }
} 
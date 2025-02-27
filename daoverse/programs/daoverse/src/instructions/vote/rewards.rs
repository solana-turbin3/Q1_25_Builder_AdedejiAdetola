use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

// Accounts for claiming rewards after voting
#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    pub dao_mint: Box<InterfaceAccount<'info, Mint>>,

    // Proposal that was voted on
    #[account(
        mut, 
        seeds=[b"proposal", proposal.proposal_owner.to_bytes().as_ref(), proposal.proposal_seed.to_le_bytes().as_ref()],
        bump=proposal.bump,
    )]
    pub proposal: Box<Account<'info, ProposalState>>,

    // Voter's DAO tokens
    #[account(
        mut,
        associated_token::mint = dao_mint,
        associated_token::authority = voter,
    )]
    pub voter_dao_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    // Staking vault from the proposal
    #[account(
        mut,
        associated_token::mint = dao_mint,
        associated_token::authority = proposal,
    )]
    pub staking_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    #[account(
        mut,
        seeds = [b"dao", dao.dao_creator.to_bytes().as_ref(), dao.dao_seed.to_le_bytes().as_ref()],
        bump = dao.bump,
    )]
    pub dao: Box<Account<'info, DaoConfig>>,

    //dao treasury - vault
    #[account(
        mut,
        associated_token::mint = dao_mint,
        associated_token::authority = dao,
    )]
    pub dao_treasury: Box<InterfaceAccount<'info, TokenAccount>>,

    // Vote record
    #[account(
        mut,
        seeds = [b"voter", vote_record.voter.to_bytes().as_ref(), vote_record.proposal_id.to_bytes().as_ref()],
        bump = vote_record.bump,

        //
        // constraint = vote_record.voter == voter.key() @ ErrorCode::InvalidVoter,
        // constraint = vote_record.proposal_id == proposal.key() @ ErrorCode::InvalidProposal,
        // constraint = !vote_record.claimed @ ErrorCode::RewardsAlreadyClaimed,
    )]
    pub vote_record: Box<Account<'info, VoteState>>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> ClaimRewards<'info> {
    // Finalize proposal when voting ends


    pub fn finalize_proposal(&mut self) -> Result<()> {
        // Check if voting period has ended
        let _current_time = Clock::get()?.unix_timestamp;
        // if current_time < self.proposal.voting_end_time {
        //     return err!(ErrorCode::VotingPeriodNotEnded);
        // }

        // Calculate 20% reward from total staked tokens
        let reward_amount = self
            .proposal
            .staking_vault_balance
            .checked_mul(20)
            .ok_or(ErrorCode::CalculationError)?
            .checked_div(100)
            .ok_or(ErrorCode::CalculationError)?;

        // Transfer reward from DAO treasury to staking vault
        transfer_checked(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                TransferChecked {
                    from: self.dao_treasury.to_account_info(),
                    mint: self.dao_mint.to_account_info(),
                    to: self.staking_vault.to_account_info(),
                    authority: self.dao.to_account_info(),
                },
                &[&[
                    b"dao",
                    self.dao.dao_creator.to_bytes().as_ref(),
                    self.dao.dao_seed.to_le_bytes().as_ref(),
                    &[self.dao.bump],
                ]],
            ),
            reward_amount,
            self.dao_mint.decimals,
        )?;
        // Update proposal state
        self.proposal.staking_vault_balance = self
            .proposal
            .staking_vault_balance
            .checked_add(reward_amount)
            .ok_or(ErrorCode::CalculationError)?;
        self.proposal.voting_end_time = 0; // Mark as finalized

        Ok(())
    }
    // Claim staked tokens plus interest

    pub fn claim_rewards(&mut self) -> Result<()> {
        // Calculate reward based on staked amount
        let staked_amount = self.vote_record.tokens_staked;
        
        // Transfer original staked amount from staking vault to voter
        transfer_checked(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                TransferChecked {
                    from: self.staking_vault.to_account_info(),
                    mint: self.dao_mint.to_account_info(),
                    to: self.voter_dao_ata.to_account_info(),
                    authority: self.proposal.to_account_info(),
                },
                &[&[
                    b"proposal",
                    self.proposal.proposal_owner.to_bytes().as_ref(),
                    self.proposal.proposal_seed.to_le_bytes().as_ref(),
                    &[self.proposal.bump],
                ]],
            ),
            staked_amount,
            self.dao_mint.decimals,
        )?;
    
        // Calculate interest (20% of staked amount)
        let interest = staked_amount
            .checked_mul(20)
            .ok_or(ErrorCode::CalculationError)?
            .checked_div(100)
            .ok_or(ErrorCode::CalculationError)?;
    
        // Check if dao treasury has enough for interest
        if self.dao_treasury.amount < interest {
            return err!(ErrorCode::InsufficientFunds);
        }
    
        // Transfer interest from treasury to voter
        transfer_checked(
            CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                TransferChecked {
                    from: self.dao_treasury.to_account_info(),
                    mint: self.dao_mint.to_account_info(),
                    to: self.voter_dao_ata.to_account_info(),
                    authority: self.dao.to_account_info(),
                },
                &[&[
                    b"dao",
                    self.dao.dao_creator.to_bytes().as_ref(),
                    self.dao.dao_seed.to_le_bytes().as_ref(),
                    &[self.dao.bump],
                ]],
            ),
            interest,
            self.dao_mint.decimals,
        )?;
    
        // Update proposal staking vault balance after withdrawal
        self.proposal.staking_vault_balance = self
            .proposal
            .staking_vault_balance
            .checked_sub(staked_amount)
            .ok_or(ErrorCode::CalculationError)?;
    
        // Mark vote as claimed
        self.vote_record.claimed = true;
    
        // If staking vault is now empty, close it
        if self.staking_vault.amount == 0 {
            close_account(CpiContext::new_with_signer(
                self.token_program.to_account_info(),
                CloseAccount {
                    account: self.staking_vault.to_account_info(),
                    destination: self.voter_dao_ata.to_account_info(),
                    authority: self.proposal.to_account_info(),
                },
                &[&[
                    b"proposal",
                    self.proposal.proposal_owner.to_bytes().as_ref(),
                    self.proposal.proposal_seed.to_le_bytes().as_ref(),
                    &[self.proposal.bump],
                ]],
            ))?;
        }
    
        Ok(())
    }
}

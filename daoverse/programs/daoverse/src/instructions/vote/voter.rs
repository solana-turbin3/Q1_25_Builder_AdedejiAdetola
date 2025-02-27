use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};

// Accounts for voting on a proposal
#[derive(Accounts)]
#[instruction(vote_seed: u64)]


pub struct Voter<'info> {
    #[account(mut)]
    pub voter: Signer<'info>,

    pub dao_mint: Box<InterfaceAccount<'info, Mint>>,

    // Vote record
    #[account(
        init,
        payer = voter,
        space = 8 + VoteState::INIT_SPACE,
        seeds = [b"voter", voter.key().as_ref(), proposal.key().as_ref()],
        bump,
    )]
    pub vote_recordss: Box<Account<'info, VoteState>>,

    // voter.key().as_ref(),proposal.key().as_ref(), vote_seed.to_le_bytes().as_ref()

    #[account(
        mut,
        seeds = [b"dao", dao.dao_creator.to_bytes().as_ref(), dao.dao_seed.to_le_bytes().as_ref()],
        bump = dao.bump,
    )]
    pub dao: Box<Account<'info, DaoConfig>>,

    // Proposal being voted on
    #[account(
        mut, 
        seeds=[b"proposal", proposal.proposal_owner.to_bytes().as_ref(), proposal.proposal_seed.to_le_bytes().as_ref()],
        bump = proposal.bump,
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

    

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Voter<'info> {
    // Validate the voter has enough tokens and meets requirements
    pub fn validate_voter(&self, tokens_to_stake: u64) -> Result<()> {
        // Check if voting period has ended
        let current_time = Clock::get()?.unix_timestamp;
        if current_time >= self.proposal.voting_end_time || self.proposal.voting_end_time == 0 {
            return err!(ErrorCode::VotingPeriodEnded);
        }

        // Check if voter has minimum required tokens (150)
        if self.voter_dao_ata.amount < 150 {
            return err!(ErrorCode::InsufficientDaoTokens);
        }

        // Check if staking amount meets proposal's minimum requirement
        if tokens_to_stake < self.proposal.min_token_stake {
            return err!(ErrorCode::InsufficientStake);
        }

        // Check if voter has enough tokens to stake
        if self.voter_dao_ata.amount < tokens_to_stake {
            return err!(ErrorCode::InsufficientDaoTokens);
        }

        Ok(())
    }

    // Record vote and transfer tokens to staking vault
    pub fn cast_vote(
        &mut self,
        bumps: VoterBumps,
        vote_type: VoteType,
        tokens_to_stake: u64,
        vote_seed: u64,
    ) -> Result<()> {
        // Record vote in the vote record account
        self.vote_recordss.set_inner(VoteState {
            voter: self.voter.key(),
            proposal_id: self.proposal.key(),
            vote_seed,
            bump: bumps.vote_recordss,
            vote_type,
            tokens_staked: tokens_to_stake,
            claimed: false,
        });

        // Update proposal vote counts
        match vote_type {
            VoteType::Yes => {
                self.proposal.vote_count_yes = self
                    .proposal
                    .vote_count_yes
                    .checked_add(1)
                    .ok_or(ErrorCode::CalculationError)?;
            }
            VoteType::No => {
                self.proposal.vote_count_no = self
                    .proposal
                    .vote_count_no
                    .checked_add(1)
                    .ok_or(ErrorCode::CalculationError)?;
            }
        }

        // Update staking vault balance
        self.proposal.staking_vault_balance = self
            .proposal
            .staking_vault_balance
            .checked_add(tokens_to_stake)
            .ok_or(ErrorCode::CalculationError)?;

        // Transfer tokens from voter to staking vault
        transfer_checked(
            CpiContext::new(
                self.token_program.to_account_info(),
                TransferChecked {
                    from: self.voter_dao_ata.to_account_info(),
                    mint: self.dao_mint.to_account_info(),
                    to: self.staking_vault.to_account_info(),
                    authority: self.voter.to_account_info(),
                },
            ),
            tokens_to_stake,
            self.dao_mint.decimals,
        )?;

        Ok(())
    }
}

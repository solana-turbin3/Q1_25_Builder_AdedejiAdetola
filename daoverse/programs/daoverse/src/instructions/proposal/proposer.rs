use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

//accounts
#[derive(Accounts)]
#[instruction(proposal_seed: u64)]

pub struct Proposer<'info> {
    //proposer as signer
    #[account(mut)]
    pub proposer: Signer<'info>,
    pub dao_mint: Box<InterfaceAccount<'info, Mint>>,
    //proposer dao ata

    //proposer dao ata for dao mint
    #[account(
        mut,
        associated_token::mint=dao_mint,
        associated_token::authority=proposer,
    )]
    pub proposer_dao_ata: Box<InterfaceAccount<'info, TokenAccount>>,

    //proposal state
    #[account(
        init,
        payer = proposer,
        space= 8 + ProposalState::INIT_SPACE,
        seeds=[b"proposal", proposer.key().as_ref(), proposal_seed.to_le_bytes().as_ref()],
        bump,
    )]
    pub proposal: Box<Account<'info, ProposalState>>,

    //staking vault
    #[account(
        init,
        payer = proposer,
        associated_token::mint = dao_mint,
        associated_token::authority = proposal,
    )]
    pub staking_vault: Box<InterfaceAccount<'info, TokenAccount>>,

    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Proposer<'info> {
    //validate proposer
    pub fn validate_proposer(&self) -> Result<()> {
        if self.proposer_dao_ata.mint != self.dao_mint.key() {
            return err!(ErrorCode::InvalidDaoMint);
        }
        if self.proposer_dao_ata.amount < 200 {
            return err!(ErrorCode::InsufficientDaoTokens);
        }
        Ok(())
    }

    //create proposal
    pub fn create_proposal(
        &mut self,
        bumps: ProposerBumps,
        proposal_seed: u64,
        proposal_title: String,
        proposal_details: String,
        proposal_cost: u64,
        min_token_stake: u64,
        voting_end_time: i64,
    ) {
        self.proposal.set_inner(ProposalState {
            proposal_seed,
            proposal_owner: self.proposer.key(),
            bump: bumps.proposal,
            proposal_title,
            proposal_details,
            proposal_cost,
            min_token_stake,
            vote_count_yes: 0,
            vote_count_no: 0,
            voting_end_time,
            staking_vault_balance: 0,
        });
    }
}

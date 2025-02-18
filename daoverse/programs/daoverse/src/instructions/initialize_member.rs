use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
#[instruction(member_seed: u64)]

//to get the user's dao balance, we need the ata of the dao mint
//how does the user now join the dao? - by having a sufficient amount of the dao_mint

pub struct InitializeMember<'info> {
    //member
    #[account(mut)]
    pub user: Signer<'info>,
    pub dao_mint: InterfaceAccount<'info, Mint>,

    //dao member state
    #[account(
        init,
        payer=user,
        space=8+DaoMemberState::INIT_SPACE,
        seeds=[b"member", user.key().as_ref(), member_seed.to_le_bytes().as_ref()],
        bump,
    )]
    pub member: Account<'info, DaoMemberState>,

    //member's dao
    #[account(
        mut,
        associated_token::mint=dao_mint,
        associated_token::authority=member,
    )]
    pub member_dao_ata: InterfaceAccount<'info, TokenAccount>,

    //dao
    #[account(
        mut,
        has_one=dao_mint,
        seeds=[b"dao", dao.dao_creator.key().as_ref(), dao.dao_seed.to_le_bytes().as_ref()],
        bump=dao.bump,
    )]
    pub dao: Account<'info, DaoConfig>,

    //dao treasury? - not needed since transfer is not made
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
}

//validate dao memeber - member_dao_ata amount greater than 100 and the mint is same as dao_mint

//do i need to monitor the dao_member_balance since i can always get it from the memeber's ata.amount?
//initialize Dao Member

impl<'info> InitializeMember<'info> {
    pub fn validate_member(&self) -> Result<()> {
        // Validate that the member's token account mint matches the DAO's mint
        if self.member_dao_ata.mint != self.dao_mint.key() {
            return err!(ErrorCode::InvalidDaoMint);
        }
        // Validate member has sufficient DAO tokens (>100) AND correct mint
        if self.member_dao_ata.amount < 100 {
            return err!(ErrorCode::InsufficientDaoTokens);
        }

        Ok(())
    }

    pub fn initialize_member(&mut self, bumps: InitializeMemberBumps, member_seed: u64) {
        self.member.set_inner(DaoMemberState {
            member_seed,
            dao_member: self.user.key(),
            bump: bumps.member,
            created_proposals: 0,
            approved_proposals: 0,
            total_rewards: 0,
            total_votes: 0,
            dao_member_balance: self.member_dao_ata.amount,
            dao_joined: self.dao.key(),
        });
    }

    //Update member balance method if needed
    pub fn update_member_balance(&mut self) -> Result<()> {
        self.member.dao_member_balance = self.member_dao_ata.amount;
        Ok(())
    }
}

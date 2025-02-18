use crate::errors::ErrorCode;
use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateMember<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"member", user.key().as_ref(), member.member_seed.to_le_bytes().as_ref()],
        bump = member.bump,
        constraint = member.dao_member == user.key() @ ErrorCode::Unauthorized
    )]
    pub member: Account<'info, DaoMemberState>,
}

impl<'info> UpdateMember<'info> {
    pub fn update_member(
        &mut self,
        created_proposals: Option<u64>,
        approved_proposals: Option<u64>,
        total_rewards: Option<u64>,
        total_votes: Option<u64>,
    ) -> Result<()> {
        let member = &mut self.member;

        if let Some(proposals) = created_proposals {
            member.created_proposals = proposals;
        }

        if let Some(approved) = approved_proposals {
            member.approved_proposals = approved;
        }

        if let Some(rewards) = total_rewards {
            member.total_rewards = rewards;
        }

        if let Some(votes) = total_votes {
            member.total_votes = votes;
        }

        Ok(())
    }
}

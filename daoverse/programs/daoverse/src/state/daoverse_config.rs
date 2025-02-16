use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]

pub struct DaoverseConfig {
    pub admin: Pubkey,
    pub daoverse_mint: Pubkey,
    pub receive_amount: u64,
}

//multiple proposals and multiple votes implies using seed in the staking vault state as well as the proposal pda

//dao creator should have a paid: bool field state

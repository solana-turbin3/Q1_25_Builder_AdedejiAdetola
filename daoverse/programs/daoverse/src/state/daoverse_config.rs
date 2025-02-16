use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]

pub struct DaoverseConfig {
    pub admin: Pubkey,
    pub daoverse_mint: Pubkey,
    pub dao_creation_fee: u64,
    pub bump: u8,
    pub daoverse_treasury_balance: u64,
    #[max_len(32)]
    pub admin_name: String,
    #[max_len(200)]
    pub daoverse_description: String,
}

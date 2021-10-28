use solana_program::{
   program_error::ProgramError,
   program_pack::{IsInitialized, Pack, Sealed},
   pubkey::Pubkey,
};


use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};

pub struct Staked {
   pub is_staked: bool,
   pub date_initialized: UnixTimestamp,
   pub author_address: Pubkey,
   pub nft_address: Pubkey,
}

impl Sealed for Staked {}

impl IsInitialized for Staked {
   fn is_initialized(&self) -> bool {
       self.is_staked
   }
}

impl Pack for Escrow {
}

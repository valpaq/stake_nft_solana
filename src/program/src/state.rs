use solana_program::{
   program_error::ProgramError,
   program_pack::{IsInitialized, Pack, Sealed},
   pubkey::Pubkey
};
use borsh::{BorshDeserialize, BorshSerialize};
use arrayref::{array_mut_ref, array_ref, array_refs, mut_array_refs};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct Stake {
   pub is_initialized: bool,
   pub date_initialized: i64,
   pub author_address: Pubkey,
   pub nft_address: Pubkey,
   pub associated_account: Pubkey,
}

impl Sealed for Stake {}

impl IsInitialized for Stake {
   fn is_initialized(&self) -> bool {
       self.is_initialized
   }
}

impl Pack for Stake {
   // 1 (bool) + 3 * 32 (Pubkey) + 1 * 8 (i64)(timestamp) = 105
   const LEN: usize = 105; 
   fn unpack_from_slice(src: &[u8]) -> Result<Self, ProgramError> {
      let src = array_ref![src, 0, Stake::LEN];
      let (
          is_initialized,
          date_initialized,
          author_address,
          nft_address,
          associated_account,
      ) = array_refs![src, 1, 8, 32, 32, 32];
      let is_initialized = match is_initialized {
          [0] => false,
          [1] => true,
          _ => return Err(ProgramError::InvalidAccountData),
      };

      Ok(Stake {
          is_initialized,
          date_initialized: i64::from_le_bytes(*date_initialized),
          author_address: Pubkey::new_from_array(*author_address),
          nft_address: Pubkey::new_from_array(*nft_address),
          associated_account: Pubkey::new_from_array(*associated_account),
      })
  }

  fn pack_into_slice(&self, dst: &mut [u8]) {
      let dst = array_mut_ref![dst, 0, Stake::LEN];
      let (
         is_initialized_dst,
         date_initialized_dst,
         author_address_dst,
         nft_address_dst,
         associated_account_dst,
     ) = mut_array_refs![dst, 1, 8, 32, 32, 32];

      let Stake {
         is_initialized,
         date_initialized,
         author_address,
         nft_address,
         associated_account,
      } = self;

      is_initialized_dst[0] = *is_initialized as u8;
      author_address_dst.copy_from_slice(author_address.as_ref());
      nft_address_dst.copy_from_slice(nft_address.as_ref());
      *date_initialized_dst = date_initialized.to_le_bytes();
      associated_account_dst.copy_from_slice(associated_account.as_ref());
      
  }
}

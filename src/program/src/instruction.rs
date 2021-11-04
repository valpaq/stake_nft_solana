use solana_program::program_error::ProgramError;
use crate::error::StakeError::{InvalidInstruction};

pub enum StakeInstruction {
    /// Stake NFT by sending it to the account
    ///
    ///
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account of the person initializing the stake
    /// 1. `[writable]` NFT mint account
    /// 2. `[writable]` NFT token account
    /// 2. `[writable]` The stake account, it will hold all necessary info.
    /// 3. `[writable]` Associated token account
    /// 4. `[writable]` PDA account
    /// 5. `[]` System Program
    /// 6. `[]` Rent sysvar
    /// 7. `[]` Token program
    /// 8. `[]` Associated token program id
    /// 9. `[]` Clock sysvar
    Stake {
    },
    /// Unstake NFT 
    ///
    ///
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account of the person initializing the stake
    /// 1. `[writable]` NFT mint account
    /// 2. `[writable]` NFT token account
    /// 2. `[writable]` The stake account, it will hold all necessary info.
    /// 3. `[writable]` Associated token account
    /// 4. `[writable]` PDA account
    /// 5. `[]` Token program
    /// 6. `[]` Associated token program id
    /// 7. `[]` Clock sysvar
    Unstake {
    }
}

impl StakeInstruction {
    // Unpacks a byte buffer into a [EscrowInstruction](enum.EscrowInstruction.html).
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, _rest) = input.split_first().ok_or(InvalidInstruction)?;

        Ok(match tag {
            0 => Self::Stake{},
            1 => Self::Unstake{},
            _ => return Err(ProgramError::InvalidAccountData),
        })
    }
}

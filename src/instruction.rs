use solana_program::program_error::ProgramError;
use std::convert::TryInto;

use crate::error::StakeError::{InvalidAddress, InvalidInstruction};

pub enum StakeInstruction {
    /// Stake NFT by sending it to the account
    ///
    ///
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account of the person initializing the stake
    /// 1. `[writable]` NFT address
    /// 2. `[writable]` The escrow account, it will hold all necessary info.
    /// 3. `[]` Token program
    Stake {
    },
    /// Unstake NFT 
    ///
    ///
    /// Accounts expected:
    ///
    /// 0. `[signer]` The account of the person taking the trade
    /// 1. `[writable]` NFT address
    /// 2. `[writable]` The escrow account, it will hold all necessary info.
    /// 3. `[]` Token program
    Unstake {
    },
}

impl StakeInstruction {
    // Unpacks a byte buffer into a [EscrowInstruction](enum.EscrowInstruction.html).
    pub fn unpack(input: &[u8]) -> Result<Self, ProgramError> {
        let (tag, rest) = input.split_first().ok_or(InvalidInstruction)?;

        Ok(match tag {
            0 => Self::Stake{},
            1 => Self::Unstake{},
            _ => return Err(InvalidInstruction.into()),
        })
    }
}

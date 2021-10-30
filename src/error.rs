use thiserror::Error;

use solana_program::program_error::ProgramError;

#[derive(Error, Debug, Copy, Clone)]
pub enum StakeError {
    /// Invalid Address
    #[error("Invalid Address")]
    InvalidAddress,
    #[error("Incorrect Program Id")]
    IncorrectProgramId,
    #[error("Account Already Initialized")]
    AccountAlreadyInitialized,
    #[error("Missing Required Signature")]
    MissingRequiredSignature,
    #[error("Not Initialized Stake")]
    NotInitializedStake,
    #[error("Not Enough Time")]
    NotEnoughTime,
    #[error("Invalid Instruction")]
    InvalidInstruction,
}

impl From<StakeError> for ProgramError {
    fn from(e: StakeError) -> Self {
        ProgramError::Custom(e as u32)
    }
}
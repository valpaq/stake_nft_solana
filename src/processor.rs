use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack},
    pubkey::Pubkey,
    sysvar::{rent::Rent, Sysvar},
    clock::Clock
};

use spl_token::state::Account as TokenAccount;

use crate::{error::StakeError, instruction::StakeInstruction}; /// , state::Escrow};

pub struct Processor;
impl Processor {
    pub fn process(
        program_id: &Pubkey,
        accounts: &[AccountInfo],
        instruction_data: &[u8],
    ) -> ProgramResult {
        let instruction = StakeInstruction::unpack(instruction_data)?;

        match instruction {
            StakeInstruction::Stake {} => {
                msg!("Instruction: Stake");
                Self::stake(accounts, program_id)
            }
            StakeInstruction::Unstake {} => {
                msg!("Instruction: Unstake");
                Self::unstake(accounts, program_id)
            }
        }
    }

    fn stake(
        accounts: &[AccountInfo],
        program_id: &Pubkey,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let initializer = next_account_info(account_info_iter)?; /// who send_transaction

        if !initializer.is_signer { 
            return Err(ProgramError::MissingRequiredSignature); 
        }

        let nft_token_account = next_account_info(account_info_iter)?;
        if *nft_token_account.owner != spl_token::id() {
            return Err(ProgramError::IncorrectProgramId);
        }/// вроде проверка на автора nft, но не уверен

        /// сюда нужно как-то передать эту инфу
        let stake_account = next_account_info(account_info_iter)?; 
        let mut stake_info = Staked::unpack_unchecked(&stake_account.try_borrow_data()?)?;
        if stake_info.is_initialized() {
            return Err(ProgramError::AccountAlreadyInitialized);
        }
        let current_clock = Clock::get();

        stake_info.is_staked = true;
        stake_info.date_initialized = current_clock.unix_timestamp;
        stake_info.author_address = *initializer.key;
        stake_info.nft_address = *nft_token_account.key;

        Stake::pack(stake_info, &mut stake_account.try_borrow_mut_data()?)?;
        let (pda, _nonce) = Pubkey::find_program_address(&[b"stake"], program_id);
/*
        let token_program = next_account_info(account_info_iter)?;
        let owner_change_ix = spl_token::instruction::set_authority(
            token_program.key,
            temp_token_account.key,
            Some(&pda),
            spl_token::instruction::AuthorityType::AccountOwner,
            initializer.key,
            &[&initializer.key],
        )?;

        msg!("Calling the token program to transfer token account ownership...");
        invoke(
            &owner_change_ix,
            &[
                temp_token_account.clone(),
                initializer.clone(),
                token_program.clone(),
            ],
        )?;
*/

        Ok(())
    }

    fn unstake(
        accounts: &[AccountInfo],
        program_id: &Pubkey,
    ) -> ProgramResult {
        
    }

    
}
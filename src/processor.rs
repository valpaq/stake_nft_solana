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
use spl_associated_token_account::{
    create_associated_token_account, get_associated_token_address};
const MONTH: i32 = 60*60*24*365/12; /// 2 628 000

use spl_token::state::Account as TokenAccount;

use crate::{error::StakeError, instruction::StakeInstruction, state::Stake};

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

        let stake_account = next_account_info(account_info_iter)?; 
        let mut stake_info = Staked::unpack_unchecked(&stake_account.try_borrow_data()?)?;
        if stake_info.is_initialized() {
            return Err(ProgramError::AccountAlreadyInitialized);
        }
        let current_clock = Clock::get();

        let (pda, _nonce) = Pubkey::find_program_address(&[b"stake"], program_id);

        let token_program = next_account_info(account_info_iter)?;
 
        /// pub fn create_associated_token_account(
        ///    funding_address: &Pubkey, 
        ///    wallet_address: &Pubkey, 
        ///    spl_token_mint_address: &Pubkey
        // ) -> Instruction

        /// pub fn get_associated_token_address(
        ///    wallet_address: &Pubkey, 
        ///    spl_token_mint_address: &Pubkey
        /// ) -> Pubkey

        let associated_account = get_associated_token_address(
            initializer.key, /// не уверен
            nft_token_account.key
        )?;

        stake_info.is_staked = true;
        stake_info.date_initialized = *current_clock.unix_timestamp;
        stake_info.author_address = *initializer.key;
        stake_info.nft_address = *nft_token_account.key;
        stake_info.associated_account = *associated_account.key;

        Stake::pack(stake_info, &mut stake_account.try_borrow_mut_data()?)?;
        /// pub fn transfer(
        ///    token_program_id: &Pubkey, 
        ///    source_pubkey: &Pubkey, 
        ///    destination_pubkey: &Pubkey, 
        ///    authority_pubkey: &Pubkey, 
        ///    signer_pubkeys: &[&Pubkey], 
        ///    amount: u64
        /// ) -> Result<Instruction, ProgramError>

        let owner_change_ix = instruction::set_authority(
            token_program.key, /// token_program_id. Не совсем понимаю что тут должно быть
            nft_token_account.key, /// owned_pubkey
            Some(&pda), /// new_authority_pubkey
            spl_token::instruction::AuthorityType::AccountOwner, ///authority_type
            initializer.key, /// owner_pubkey
            &[&initializer.key], /// signer_pubkeys
        )?;

        msg!("Calling the token program to transfer nft account ownership...");
        invoke(
            &owner_change_ix,
            &[
                nft_token_account.clone(),
                initializer.clone(),
                token_program.clone(),
            ],
        )?;

        let transfer_to_assoc_ix = spl_token::instruction::transfer(
            token_program.key,
            nft_token_account.key,
            associated_account.key,
            &pda.key,
            &[&pda.key],
            1
        )?;
        msg!("Calling the token program to transfer tokens to the nft");
        invoke_signed(
            &transfer_to_assoc_ix,
            &[
                nft_token_account.clone(),
                associated_account.clone(),
                pda.clone(),
                token_program.clone(),
            ],
            &[&[&b"stake"[..], &[nonce]]],
        )?;

        Ok(())
    }

    fn unstake(
        accounts: &[AccountInfo],
        program_id: &Pubkey,
    ) -> ProgramResult {

    }

    
}
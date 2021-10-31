use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint::ProgramResult,
    msg,
    program::{invoke, invoke_signed},
    program_error::ProgramError,
    program_pack::{IsInitialized, Pack},
    pubkey::Pubkey,
    sysvar::{Sysvar},
    clock::Clock
};
use spl_associated_token_account::{
    create_associated_token_account, get_associated_token_address};
const MONTH: i64 = 60*60*24*365/12; // 2 628 000


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
        let initializer = next_account_info(account_info_iter)?; // who send_transaction
        let nft_mint_account = next_account_info(account_info_iter)?;
        let nft_token_account = next_account_info(account_info_iter)?;
        let stake_account = next_account_info(account_info_iter)?; 
        let associated_token_account = next_account_info(account_info_iter)?;
        let pda_account = next_account_info(account_info_iter)?;
        let system_program = next_account_info(account_info_iter)?;
        let rent_sysvar = next_account_info(account_info_iter)?; 
        let token_program = next_account_info(account_info_iter)?;

        if !initializer.is_signer { 
            return Err(ProgramError::MissingRequiredSignature); 
        }


        let mut stake_info = Stake::unpack_unchecked(&stake_account.try_borrow_data()?)?;
        if stake_info.is_initialized() {
            return Err(ProgramError::AccountAlreadyInitialized);
        }
        let current_clock = Clock::get();

        let current_clock = match current_clock {
            Ok(clock) => clock,
            Err(error) => panic!("Problem with clock: {:}", error),
        };



        let (pda, _nonce) = Pubkey::find_program_address(&[b"stake"], program_id);

        if *pda_account.key != pda{
            return Err(ProgramError::InvalidAccountData);
        }
 
        // pub fn create_associated_token_account(
        //    funding_address: &Pubkey, 
        //    wallet_address: &Pubkey, 
        //    spl_token_mint_address: &Pubkey
        // ) -> Instruction

        // pub fn get_associated_token_address(
        //     wallet_address: &Pubkey, 
        //     spl_token_mint_address: &Pubkey
        //  ) -> Pubkey

        let associated_token_address = get_associated_token_address(
            &pda_account.key, 
            &nft_mint_account.key,
        );

        if associated_token_address != *associated_token_account.key{
            return Err(ProgramError::InvalidAccountData);
        }
                

        let associated_account_ix = create_associated_token_account(
            &initializer.key, // funding - платит за транзакцию - пользователя
            &pda, // для кого(нас)
            &nft_mint_account.key
        );
        // [writeable,signer] Funding account (must be a system account)
        // [writeable] Associated token account address to be created
        // [] Wallet address for the new associated token account
        // [] The token mint for the new associated token account
        // [] System program
        // [] SPL Token program
        // [] Rent sysvar

        invoke(
            &associated_account_ix,
            &[
                initializer.clone(),
                associated_token_account.clone(),
                pda_account.clone(),
                nft_mint_account.clone(),
                system_program.clone(),
                token_program.clone(),
                rent_sysvar.clone()
            ]
        );


        stake_info.is_initialized = true;
        stake_info.date_initialized = current_clock.unix_timestamp;
        stake_info.author_address = *initializer.key;
        stake_info.nft_address = *nft_token_account.key;
        stake_info.associated_account = associated_token_address;

        Stake::pack(stake_info, &mut stake_account.try_borrow_mut_data()?)?;
        // pub fn transfer(
        //    token_program_id: &Pubkey, 
        //    source_pubkey: &Pubkey, 
        //    destination_pubkey: &Pubkey, 
        //    authority_pubkey: &Pubkey, 
        //    signer_pubkeys: &[&Pubkey], 
        //    amount: u64
        // ) -> Result<Instruction, ProgramError>

        let associated_initializer_token_account = get_associated_token_address(
            initializer.key, 
            &nft_mint_account.key,
        );

        if associated_initializer_token_account != *nft_token_account.key{
            return Err(ProgramError::InvalidAccountData);
        }

        
        let transfer_to_assoc_ix = spl_token::instruction::transfer(
            token_program.key,
            nft_token_account.key,
            &associated_token_address,
            &initializer.key,
            &[&initializer.key],
            1
        )?;
        msg!("Calling the token program to transfer tokens to the nft");
        invoke(
            &transfer_to_assoc_ix,
            &[
                nft_token_account.clone(),
                associated_token_account.clone(),
                initializer.clone(),
                token_program.clone(),
            ],
        )?;

        Ok(())
    }
/*

    fn unstake(
        accounts: &[AccountInfo],
        program_id: &Pubkey,
    ) -> ProgramResult {
        let account_info_iter = &mut accounts.iter();
        let initializer = next_account_info(account_info_iter)?;

        if !initializer.is_signer {
            return Err(ProgramError::MissingRequiredSignature);
        }

        let nft_token_account = next_account_info(account_info_iter)?;

        let stake_account = next_account_info(account_info_iter)?; 
        let mut stake_info = Stake::unpack(&stake_account.try_borrow_data()?)?;
        // pub is_initialized: bool,
        // pub date_initialized: UnixTimestamp,
        // pub author_address: Pubkey,
        // pub nft_address: Pubkey,
        // pub associated_account: Pubkey,
        
        let current_clock = Clock::get();
        let current_clock = match current_clock {
            Ok(clock) => clock,
            Err(error) => panic!("Problem with clock: {:}", error),
        };

        if !stake_info.is_initialized{
            return Err(StakeError::NotInitializedStake.into());
        }
        if stake_info.date_initialized + MONTH < current_clock.unix_timestamp{
            return Err(StakeError::NotEnoughTime.into());
        }
        if stake_info.author_address != *initializer.key{
            return Err(StakeError::InvalidAddress.into());
        }
        if stake_info.nft_address != *nft_token_account.key{
            return Err(StakeError::InvalidAddress.into());
        }

        let (pda, nonce) = Pubkey::find_program_address(&[b"stake"], program_id);

        let token_program = next_account_info(account_info_iter)?;

        let transfer_to_giver_ix = spl_token::instruction::transfer(
            token_program.key,
            &stake_info.associated_account,
            nft_token_account.key,
            &pda,
            &[&pda],
            1,
        )?;
        msg!("Calling the token program to transfer nft to the giver...");
        invoke_signed(
            &transfer_to_giver_ix,
            &[
                stake_info.associated_account.clone(),
                nft_token_account.clone(),
                pda_account.clone(), // не знаю что сюда
                token_program.clone(),
            ],
            &[&[&b"stake"[..], &[nonce]]],
        )?;

        Ok(())

    }
*/
    
}
import os from 'os';
import yaml from 'yaml';
import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {TOKEN_PROGRAM_ID} from "@solana/spl-token";
import fs from 'mz/fs';
import path from 'path';
import * as simple from "./simple_utils";


let connection: Connection;


let initializer: Keypair ;
let nftMintAccount: Keypair;
let nftTokenAccount: Keypair;
let stakeAccount: any; 
let associatedTokenAccount: Keypair;
let pda_account: PublicKey;
let systemProgram: Keypair;
let rentSysvar: Keypair; 
let stakePubkey: PublicKey;
let programId: any;
let nonce: Number;

const STAKE_SEED = 'stake';
const STAKE_SIZE = 105;
const PROGRAM_PATH = path.resolve(__dirname, '../../dist/program');

const PROGRAM_SO_PATH = path.join(PROGRAM_PATH, 'staking_program.so');

const PROGRAM_KEYPAIR_PATH = path.join(PROGRAM_PATH, 'staking_program-keypair.json');

/**
 * Establish a connection to the cluster
 */
export async function establishConnection(): Promise<void> {
  const rpcUrl = await simple.getRpcUrl();
  connection = new Connection(rpcUrl, 'confirmed');
  const version = await connection.getVersion();
  console.log('Connection to cluster established:', rpcUrl, version);
}

export async function establishInitializer(): Promise<void> {
  let fees = 0;
  const {feeCalculator} = await connection.getRecentBlockhash();

  // Calculate the cost to fund the greeter account
  fees += await connection.getMinimumBalanceForRentExemption(STAKE_SIZE);

  // Calculate the cost of sending transactions
  fees += feeCalculator.lamportsPerSignature * 100; // wag
  initializer = await simple.createKeypairFromSFile("initializer");
  let lamports = await connection.getBalance(initializer.publicKey);
  if (lamports < fees) {
    // If current balance is not enough to pay for fees, request an airdrop
    const sig = await connection.requestAirdrop(
      initializer.publicKey,
      fees * 20,
    );
    await connection.confirmTransaction(sig);
    lamports = await connection.getBalance(initializer.publicKey);
  }

}

export async function checkProgram(): Promise<void> {
  // Read program id from keypair file
  try {
    const programKeypair = await simple.createKeypairFromFile(PROGRAM_KEYPAIR_PATH);
    programId = programKeypair.publicKey;
  } catch (err) {
    const errMsg = (err as Error).message;
    throw new Error(
      `Failed to read program keypair at '${PROGRAM_KEYPAIR_PATH}' due to error: ${errMsg}. Program may need to be deployed with \`solana program deploy dist/program/helloworld.so\``,
    );
  }

  // Check if the program has been deployed
  const programInfo = await connection.getAccountInfo(programId);
  if (programInfo === null) {
    if (fs.existsSync(PROGRAM_SO_PATH)) {
      throw new Error(
        'Program needs to be deployed with `solana program deploy dist/program/helloworld.so`',
      );
    } else {
      throw new Error('Program needs to be built and deployed');
    }
  } else if (!programInfo.executable) {
    throw new Error(`Program is not executable`);
  }
  console.log(`Using program ${programId.toBase58()}`);
}

export async function getAllOtherAccounts(): Promise<void>{
  [pda_account, nonce] = await PublicKey.findProgramAddress(
    [Buffer.from('stake')],
    programId
  );
  nftMintAccount = await simple.createKeypairFromSFile("nft_mint_account");
  nftTokenAccount = await simple.createKeypairFromSFile("nft_token_account");
  associatedTokenAccount = await simple.createKeypairFromSFile("associated_token_account");
  systemProgram = await simple.createKeypairFromSFile("system_program");
  rentSysvar = await simple.createKeypairFromSFile("rent_sysvar");


  // Check if the greeting account has already been created
  stakePubkey = await PublicKey.createWithSeed(
    initializer.publicKey,
    STAKE_SEED,
    programId,
  );
  stakeAccount = await connection.getAccountInfo(stakePubkey);
  if (stakeAccount === null) {
    console.log(
      'Creating account',
      stakePubkey.toBase58(),
      'to say stake',
    );
    const lamports = await connection.getMinimumBalanceForRentExemption(
      STAKE_SIZE,
    );
    const transaction = new Transaction().add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: initializer.publicKey,
        basePubkey: initializer.publicKey,
        seed: STAKE_SEED,
        newAccountPubkey: stakePubkey,
        lamports,
        space: STAKE_SIZE,
        programId,
      }),
    );

    await sendAndConfirmTransaction(connection, transaction, [initializer]);
  }
}

export async function stake(): Promise<void> {
  const stakeInstruction = new TransactionInstruction({
    programId: programId,
    data: Buffer.alloc(0),
    keys: [
      { pubkey: initializer.publicKey, isSigner: true, isWritable: false },
      { pubkey: nftMintAccount.publicKey, isSigner: false, isWritable: true },
      { pubkey: nftTokenAccount.publicKey, isSigner: false, isWritable: true },
      { pubkey: stakePubkey, isSigner: false, isWritable: true },
      { pubkey: associatedTokenAccount.publicKey, isSigner: false, isWritable: true },
      { pubkey: pda_account, isSigner: false, isWritable: true },
      { pubkey: systemProgram.publicKey, isSigner: false, isWritable: false },
      { pubkey: rentSysvar.publicKey, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
    ],
  });

  await connection.sendTransaction(
    new Transaction().add(stakeInstruction),
    [initializer],
    { skipPreflight: false, preflightCommitment: "confirmed" }
  );
  
}

export async function unstake(): Promise<void> {
  const stakeInstruction = new TransactionInstruction({
    programId: programId,
    data: Buffer.alloc(0),
    keys: [
      { pubkey: initializer.publicKey, isSigner: true, isWritable: false },
      { pubkey: nftMintAccount.publicKey, isSigner: false, isWritable: true },
      { pubkey: nftTokenAccount.publicKey, isSigner: false, isWritable: true },
      { pubkey: stakeAccount, isSigner: false, isWritable: true },
      { pubkey: associatedTokenAccount.publicKey, isSigner: false, isWritable: true },
      { pubkey: pda_account, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false }
    ],
  });

  await connection.sendTransaction(
    new Transaction().add(stakeInstruction),
    [initializer],
    { skipPreflight: false, preflightCommitment: "confirmed" }
  );
}

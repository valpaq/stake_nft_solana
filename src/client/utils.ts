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
let nft_mint_account: Keypair;
let nft_token_account: Keypair;
let stake_account: Keypair; 
let associated_token_account: Keypair;
let pda_account: PublicKey;
let system_program: Keypair;
let rent_sysvar: Keypair; 
let token_program = TOKEN_PROGRAM_ID;
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

  initializer = await simple.createKeypairFromFile("initializer");

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
    [Buffer.from(STAKE_SEED)],
    programId
  );
  nft_mint_account = await simple.createKeypairFromSFile("nft_mint_account");;
  nft_token_account = await simple.createKeypairFromSFile("nft_token_account");;
  stake_account = await simple.createKeypairFromSFile("stake_account");; 
  associated_token_account = await simple.createKeypairFromSFile("associated_token_account");;
  system_program = await simple.createKeypairFromSFile("system_program");;
  rent_sysvar = await simple.createKeypairFromSFile("rent_sysvar");; 

  // Check if the greeting account has already been created
  const greetedAccount = await connection.getAccountInfo(greetedPubkey);
  if (greetedAccount === null) {
    console.log(
      'Creating account',
      greetedPubkey.toBase58(),
      'to say hello to',
    );
    const lamports = await connection.getMinimumBalanceForRentExemption(
      STAKE_SIZE,
    );

    const transaction = new Transaction().add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: initializer.publicKey,
        basePubkey: initializer.publicKey,
        seed: STAKE_SEED,
        newAccountPubkey: greetedPubkey,
        lamports,
        space: GREETING_SIZE,
        programId,
      }),
    );
    await sendAndConfirmTransaction(connection, transaction, [payer]);
  }
}

/**
 * Say hello
 */
export async function stake(): Promise<void> {
  console.log('Saying hello to', greetedPubkey.toBase58());
  const instruction = new TransactionInstruction({
    keys: [{pubkey: greetedPubkey, isSigner: false, isWritable: true}],
    programId,
    data: Buffer.alloc(0), // All instructions are hellos
  });
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [payer],
  );
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

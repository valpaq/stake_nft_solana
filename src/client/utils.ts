//@ts-expect-error missing types
import * as BufferLayout from "buffer-layout";
const BN = require("bn.js");
import {
  Keypair,
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  SYSVAR_CLOCK_PUBKEY,
  SYSVAR_RENT_PUBKEY,
} from '@solana/web3.js';
import {TOKEN_PROGRAM_ID, Token, ASSOCIATED_TOKEN_PROGRAM_ID} from "@solana/spl-token";
import fs from 'mz/fs';
import path from 'path';
import * as simple from "./simple_utils";

const publicKey = (property = "publicKey") => {
  return BufferLayout.blob(32, property);
};

const int64 = (property = "int64") => {
  return BufferLayout.blob(8, property);
};

export const STAKE_ACCOUNT_DATA_LAYOUT = BufferLayout.struct([
  BufferLayout.u8("isInitialized"),
  int64("date_initialized"),
  publicKey("author_address"),
  publicKey("nft_address"),
  publicKey("associated_account"),
]);

export interface StakeLayout {
  isInitialized: boolean;
  date_initialized: Uint8Array;
  author_address: Uint8Array;
  nft_address: Uint8Array;
  associated_account: Uint8Array;
}

const STAKE_SEED = 'stake';
const STAKE_SIZE = 105;
const PROGRAM_PATH = path.resolve(__dirname, '../../dist/program');

const PROGRAM_SO_PATH = path.join(PROGRAM_PATH, 'staking_program.so');

const PROGRAM_KEYPAIR_PATH = path.join(PROGRAM_PATH, 'staking_program-keypair.json');

export async function establishConnection(): Promise<Connection> {
  const rpcUrl = await simple.getRpcUrl();
  const connection = new Connection(rpcUrl, 'confirmed');
  const version = await connection.getVersion();
  console.log('Connection to cluster established:', rpcUrl, version);
  return connection;
}

export async function establishInitializer(connection: Connection): Promise<Keypair> {
  let fees = 0;
  const {feeCalculator} = await connection.getRecentBlockhash();

  // Calculate the cost to fund the greeter account
  fees += await connection.getMinimumBalanceForRentExemption(STAKE_SIZE);

  // Calculate the cost of sending transactions
  fees += feeCalculator.lamportsPerSignature * 1000; // wag
  const initializer = await simple.createKeypairFromSFile("initializer");
  let lamports = await connection.getBalance(initializer.publicKey);
  if (lamports < fees) {
    // If current balance is not enough to pay for fees, request an airdrop
    const sig = await connection.requestAirdrop(
      initializer.publicKey,
      fees * 200,
    );
    await connection.confirmTransaction(sig);
    lamports = await connection.getBalance(initializer.publicKey);
  }
  return initializer;

}

export async function checkProgram(connection: Connection): Promise<PublicKey> {
  // Read program id from keypair file
  let programId;
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
  return programId;
}

async function findAssociatedTokenAddress(walletAddress: PublicKey, tokenMintAddress: PublicKey): Promise<PublicKey> {
  return (
    await PublicKey.findProgramAddress(
      [walletAddress.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), tokenMintAddress.toBuffer()],
      ASSOCIATED_TOKEN_PROGRAM_ID,
    )
  )[0];
}

export async function getAllOtherAccounts(connection: Connection, initializer: Keypair, programId: PublicKey): Promise<PublicKey[]>{
  const [pda_account, nonce] = await PublicKey.findProgramAddress(
    [Buffer.from(STAKE_SEED)],
    programId
  );
  const nftMintAccount = simple.getPublicKey("mint_test");
  const nftTokenAccount = simple.getPublicKey("customer_test");
  const associatedTokenAccount = await findAssociatedTokenAddress(pda_account, nftMintAccount);
  const stakePubkey = await PublicKey.createWithSeed(
    initializer.publicKey,
    STAKE_SEED,
    programId,
  );
  return [pda_account, nftMintAccount, nftTokenAccount, associatedTokenAccount, stakePubkey];
}

export async function stake(
    connection: Connection, programId: PublicKey, initializer: Keypair,
    nftMintAccount: PublicKey, nftTokenAccount: PublicKey, stakePubkey: PublicKey,
    associatedTokenAccount: PublicKey, pda_account: PublicKey): Promise<void> {
    
  const stakeInstruction = new TransactionInstruction({
    programId: programId,
    data: Buffer.from(Uint8Array.of(0)),
    keys: [
      { pubkey: initializer.publicKey, isSigner: true, isWritable: false },
      { pubkey: nftMintAccount, isSigner: false, isWritable: true },
      { pubkey: nftTokenAccount, isSigner: false, isWritable: true },
      { pubkey: stakePubkey, isSigner: false, isWritable: true },
      { pubkey: associatedTokenAccount, isSigner: false, isWritable: true },
      { pubkey: pda_account, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false}
      ],
    });
    
    const stakeAccount = await connection.getAccountInfo(stakePubkey);
    if (stakeAccount === null) {
        console.log(
          'Creating account',
          stakePubkey.toBase58(),
          'to say stake',
        );
        const lamports = await connection.getMinimumBalanceForRentExemption(
          STAKE_SIZE,
        );
        const instruction = SystemProgram.createAccountWithSeed({
            fromPubkey: initializer.publicKey,
            basePubkey: initializer.publicKey,
            seed: STAKE_SEED,
            newAccountPubkey: stakePubkey,
            lamports,
            space: STAKE_SIZE,
            programId,
          });
        await connection.sendTransaction(
          new Transaction().add(instruction, stakeInstruction),
          [initializer],
          { skipPreflight: false, preflightCommitment: "confirmed" }
        );
    }
    else{
        await connection.sendTransaction(
          new Transaction().add(stakeInstruction),
          [initializer],
          { skipPreflight: false, preflightCommitment: "confirmed" }
        );
    }
  
}

export async function unstake(connection: Connection, programId: PublicKey, initializer: Keypair,
  nftMintAccount: PublicKey, nftTokenAccount: PublicKey, stakePubkey: PublicKey,
  associatedTokenAccount: PublicKey, pda_account: PublicKey): Promise<void> {
  const stakeInstruction = new TransactionInstruction({
    programId: programId,
    data: Buffer.from(Uint8Array.of(1)),
    keys: [
      { pubkey: initializer.publicKey, isSigner: true, isWritable: false },
      { pubkey: nftMintAccount, isSigner: false, isWritable: true },
      { pubkey: nftTokenAccount, isSigner: false, isWritable: true },
      { pubkey: stakePubkey, isSigner: false, isWritable: true },
      { pubkey: associatedTokenAccount, isSigner: false, isWritable: true },
      { pubkey: pda_account, isSigner: false, isWritable: true },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false},
      { pubkey: SYSVAR_CLOCK_PUBKEY, isSigner: false, isWritable: false}
    ],
  });

  await connection.sendTransaction(
    new Transaction().add(stakeInstruction),
    [initializer],
    { skipPreflight: false, preflightCommitment: "confirmed" }
  );
}

export async function checkStakes(connection: Connection, programId: PublicKey): Promise<Array<Object>>{
  let accounts = await connection.getProgramAccounts(programId);
  let to_return = [];
  for (let i = 0; i < accounts.length; i++){
    const encodedStakeState = accounts[i].account.data;
    const decodedStakeState = STAKE_ACCOUNT_DATA_LAYOUT.decode(
      encodedStakeState
    ) as StakeLayout;
    console.log(`${decodedStakeState.date_initialized.toString()}`);
    const dedecodedStakeStake = {
      isInitialized: new Boolean(decodedStakeState.isInitialized).valueOf(),
      date_initialized: new BN(decodedStakeState.date_initialized, 8, "le").toNumber(),
      author_address: new PublicKey(decodedStakeState.author_address).toBase58(),
      nft_address: new PublicKey(decodedStakeState.nft_address).toBase58(),
      associated_account: new PublicKey(decodedStakeState.associated_account).toBase58()
    }
    to_return.push(dedecodedStakeStake);
  }
  return to_return;
}

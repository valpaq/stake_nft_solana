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
import fs from 'mz/fs';
import path from 'path';


async function getConfig(): Promise<any> {
  // Path to Solana CLI config file
  const CONFIG_FILE_PATH = path.resolve(
    os.homedir(),
    '.config',
    'solana',
    'cli',
    'config.yml',
  );
  const configYml = await fs.readFile(CONFIG_FILE_PATH, {encoding: 'utf8'});
  return yaml.parse(configYml);
}

export async function getRpcUrl(): Promise<string> {
  try {
    const config = await getConfig();
    if (!config.json_rpc_url) throw new Error('Missing RPC URL');
    return config.json_rpc_url;
  } catch (err) {
    console.warn(
      'Failed to read RPC url from CLI config file, falling back to localhost',
    );
    return 'http://localhost:8899';
  }
}

export async function createKeypairFromSFile(
  filePath: string,
): Promise<Keypair> {
  const secretKeyString = await fs.readFile(`./src/client/keys/${filePath}_priv.json`, {encoding: 'utf8'});
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKey);
}

export async function createKeypairFromFile(
  filePath: string,
): Promise<Keypair> {
  const secretKeyString = await fs.readFile(filePath, {encoding: 'utf8'});
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKey);
}

export async function newKeypair(): Promise<Keypair> {
    return Keypair.generate();
}

export const logError = (msg: string) => {
  console.log(`\x1b[31m${msg}\x1b[0m`);
};

export const writePublicKey = (publicKey: PublicKey, name: string) => {
  fs.writeFileSync(
    `./src/client/keys/${name}_pub.json`,
    JSON.stringify(publicKey.toString())
  );
};

export const getPublicKey = (name: string) =>
  new PublicKey(
    JSON.parse(fs.readFileSync(`./src/client/keys/${name}_pub.json`) as unknown as string)
  );

export const getPrivateKey = (name: string) =>
  Uint8Array.from(
    JSON.parse(fs.readFileSync(`./src/client/keys/${name}_priv.json`) as unknown as string)
  );

export const getKeypair = (name: string) =>
  new Keypair({
    publicKey: getPublicKey(name).toBytes(),
    secretKey: getPrivateKey(name),
  });

export const getProgramId = () => {
  try {
    return getPublicKey("program");
  } catch (e) {
    logError("Given programId is missing or incorrect");
    process.exit(1);
  }
};

export const getTerms = (): {
  aliceExpectedAmount: number;
  bobExpectedAmount: number;
} => {
  return JSON.parse(fs.readFileSync(`./terms.json`) as unknown as string);
};

export const getTokenBalance = async (
  pubkey: PublicKey,
  connection: Connection
) => {
  return parseInt(
    (await connection.getTokenAccountBalance(pubkey)).value.amount
  );
};
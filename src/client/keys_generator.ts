import { Connection, Keypair, PublicKey } from "@solana/web3.js";

import * as fs from "fs";
  
export const getPublicKey = (name: string) =>
  new PublicKey(
    JSON.parse(fs.readFileSync(`./keys/${name}_pub.json`) as unknown as string)
  );

export const getPrivateKey = (name: string) =>
  Uint8Array.from(
    JSON.parse(fs.readFileSync(`./keys/${name}.json`) as unknown as string)
  );


export const GenAndWriKey = (name: string) =>
{
  const keypair = Keypair.generate();
  const address = JSON.stringify(keypair?.publicKey.toString());
  const secret = JSON.stringify(Array.from(keypair.secretKey));
  console.log(address);
  console.log(secret);
  fs.writeFile(`./keys/${name}_pub.json`, address, function(err) {
    if(err) {
        return console.log(err);
    }
  }); 
  fs.writeFile(`./keys/${name}_priv.json`, secret, function(err) {
    if(err) {
        return console.log(err);
    }
  }); 
}

async function main() {
  let names = ["initializer",
    "nft_mint_account",
    "nft_token_account",
    "stake_account",
    "associated_token_account",
    "pda_account",
    "system_program",
    "rent_sysvar",
    "token_program"]
  
  for(let i=0; i<9; i++){
    GenAndWriKey(names[i]);
    console.log(names[i]);
  }

  console.log('Success');
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);

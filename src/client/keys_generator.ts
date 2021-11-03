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


export const GenAndWriKey = () =>
{
  const keypair = Keypair.generate();
  const address = JSON.stringify(keypair?.publicKey.toString());
  const secret = JSON.stringify(Array.from(keypair.secretKey));
  console.log(address);
  console.log(secret);
}

async function main() {
  
  for(let i=0; i<9; i++){
    GenAndWriKey();
    console.log("");
    console.log("");
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

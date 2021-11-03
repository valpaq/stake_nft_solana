import {
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
    Signer,
  } from "@solana/web3.js";
  
  import { Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
  import {
    getKeypair,
    getPublicKey,
    writePublicKey,
  } from "./simple_utils";
  
  const createMint = (
    connection: Connection,
    { publicKey, secretKey }: Signer
  ) => {
    return Token.createMint(
      connection,
      {
        publicKey,
        secretKey,
      },
      publicKey,
      null,
      0,
      TOKEN_PROGRAM_ID
    );
  };
  
  const setupMint = async (
    name: string,
    connection: Connection,
    CustomerPublicKey: PublicKey,
    clientKeypair: Signer
  ): Promise<[Token, PublicKey]> => {
    console.log(`Creating Mint ${name}...`);
    const mint = await createMint(connection, clientKeypair);
    writePublicKey(mint.publicKey, `mint_${name.toLowerCase()}`);
  
    console.log(`Creating Alice TokenAccount for ${name}...`);
    const CustomertokenAccount = await mint.createAccount(CustomerPublicKey);
    writePublicKey(CustomertokenAccount, `customer_${name.toLowerCase()}`);
  
    return [mint, CustomertokenAccount];
  };
  
  const setup = async () => {
    const CustomerPublicKey = getPublicKey("initializer");
    const clientKeypair = getKeypair("id");
  
    const connection = new Connection("http://localhost:8899", "confirmed");
    console.log("Requesting SOL for customer...");
    // some networks like the local network provide an airdrop function (mainnet of course does not)
    await connection.requestAirdrop(CustomerPublicKey, LAMPORTS_PER_SOL * 100);
    await connection.requestAirdrop(
      clientKeypair.publicKey,
      LAMPORTS_PER_SOL * 100
    );
  
    const [mintX, CustomertokenAccount] = await setupMint(
      "TEST",
      connection,
      CustomerPublicKey,
      clientKeypair
    );
    console.log("Sending token to customer");
    await mintX.mintTo(CustomertokenAccount, clientKeypair.publicKey, [], 1);
  
    console.log("");
  };
  
  setup();
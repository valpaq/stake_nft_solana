import {
  establishConnection,
  establishInitializer,
  getAllOtherAccounts,
  checkProgram,
  unstake
} from './utils';


async function main() {
  console.log("Let's stake an nft");

  const connection = await establishConnection();

  const initializer = await establishInitializer(connection);
  
  const programId = await checkProgram(connection);

  const [pda_account, nftMintAccount, nftTokenAccount, 
          associatedTokenAccount, stakePubkey] 
            = await getAllOtherAccounts(connection, initializer, programId);

  await unstake(connection, programId, initializer,
    nftMintAccount, nftTokenAccount, stakePubkey,
    associatedTokenAccount, pda_account);

  console.log('Success');
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);

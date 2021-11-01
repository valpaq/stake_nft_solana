 import {
    establishConnection,
    establishNftNAuthor,
    getAllOtherAccounts,
    stake
  } from './utils';

  
  async function main() {
    console.log("Let's stake an nft");
  
    // Establish connection to the cluster
    await establishConnection();
  
    // Determine author and NFT
    await establishNftNAuthor();
  
    // Get many other accounts
    await getAllOtherAccounts();
  
    // stake NFT
    await stake();
  
    console.log('Success');
  }
  
  main().then(
    () => process.exit(),
    err => {
      console.error(err);
      process.exit(-1);
    },
  );
  
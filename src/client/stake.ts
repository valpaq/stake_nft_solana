 import {
    establishConnection,
    establishInitializer,
    getAllOtherAccounts,
    checkProgram,
    stake
  } from './utils';

  
  async function main() {
    console.log("Let's stake an nft");
  
    // Establish connection to the cluster
    await establishConnection();
  
    // Determine author and NFT
    await establishInitializer();
  
    // Get many other accounts
    await getAllOtherAccounts();

    await checkProgram()
  
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
  
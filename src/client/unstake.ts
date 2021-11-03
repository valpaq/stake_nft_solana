import {
    establishConnection,
    establishInitializer,
    getAllOtherAccounts,
    unstake,
    sleep
  } from './utils';

  
  async function main() {
    console.log("Let's stake an nft");
  
    // Establish connection to the cluster
    await establishConnection();
  
    // Determine author and NFT
    await establishInitializer();
  
    // Get many other accounts
    await getAllOtherAccounts();
  
    // unstake NFT
    await unstake();

    // wait for 40 sec
    await sleep(40000);
    
    // unstake NFT
    await unstake();
  
    console.log('Success');
  }
  
  main().then(
    () => process.exit(),
    err => {
      console.error(err);
      process.exit(-1);
    },
  );
  
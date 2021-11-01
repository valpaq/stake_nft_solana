import {
    establishConnection,
    establishNftNAuthor,
    getAllOtherAccounts,
    unstake,
    sleep
  } from './utils';

  
  async function main() {
    console.log("Let's stake an nft");
  
    // Establish connection to the cluster
    await establishConnection();
  
    // Determine author and NFT
    await establishNftNAuthor();
  
    // Get many other accounts
    await getAllOtherAccounts();
  
    // unstake NFT
    await unstake();

    // wait for 40 sec
    await sleep(2000);
  
    console.log('Success');
  }
  
  main().then(
    () => process.exit(),
    err => {
      console.error(err);
      process.exit(-1);
    },
  );
  
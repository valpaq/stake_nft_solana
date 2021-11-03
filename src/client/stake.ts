 import {
    establishConnection,
    establishInitializer,
    getAllOtherAccounts,
    checkProgram,
    stake
  } from './utils';

  
  async function main() {
    console.log("Let's stake an nft");
  
    await establishConnection();
    
    console.log("connection");
  
    await establishInitializer();
    console.log("initializer");
    
    await checkProgram();
    console.log("program");
  
    await getAllOtherAccounts();
    console.log("other");

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
  
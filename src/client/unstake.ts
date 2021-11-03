import {
  establishConnection,
  establishInitializer,
  getAllOtherAccounts,
  checkProgram,
  unstake
} from './utils';


async function main() {
  console.log("Let's unstake an nft");

  await establishConnection();
  console.log("connection");

  await establishInitializer();
  console.log("connection");

  await checkProgram();
  console.log("program");

  await getAllOtherAccounts();
  console.log("otherAccounts");

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

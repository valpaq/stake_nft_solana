// функцию, которая возвращает все стейки, которые есть в контракте? В десериализованном виде
// getProgramAccounts

import {
  establishConnection,
  checkProgram,
  checkStakes
} from './utils';


async function main() {

  await establishConnection();
  
  console.log("connection");
  
  await checkProgram();
  console.log("program");

  let stakes = await checkStakes();

  console.log(stakes);
  console.log('Success');
}

main().then(
  () => process.exit(),
  err => {
    console.error(err);
    process.exit(-1);
  },
);

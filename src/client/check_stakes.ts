// функцию, которая возвращает все стейки, которые есть в контракте? В десериализованном виде
// getProgramAccounts

import {
  establishConnection,
  checkProgram,
  checkStakes
} from './utils';


async function main() {

  const connection = await establishConnection();
  
  console.log("connection");
  
  const programId = await checkProgram(connection);
  console.log("program");

  const stakes = await checkStakes(connection, programId);

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

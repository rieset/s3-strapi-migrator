import { heating } from './common';

const [ node, script, url ] = process.argv
heating()
.then((contracts) => {
  console.log(contracts)
})
.catch((error) => {
  console.error('Unexpected error', error);
})

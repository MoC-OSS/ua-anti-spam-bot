/**
 * It parses ./temp/parse.txt file.
 * You can pass there text copied from Excel and get JSON words
 * */
const fs = require('node:fs');

const file = fs.readFileSync('./temp/parse.txt').toString();

const fileWords = file
  .split('\n')
  .map((row) => row.trim())
  .filter(Boolean)
  .flatMap((row) => row.split('\t'));

fs.writeFileSync('./temp/parse.json', JSON.stringify(fileWords, null, 2));

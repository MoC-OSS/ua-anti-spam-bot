/**
 * It parses ./temp/parse.txt file.
 * You can pass there text copied from Excel and get JSON words
 * */
const fs = require('fs');

const file = fs.readFileSync('./temp/parse.txt').toString();

const fileWords = file
  .split('\n')
  .map((row) => row.trim())
  .filter(Boolean)
  .map((row) => row.split('\t'))
  .flat();

fs.writeFileSync('./temp/parse.json', JSON.stringify(fileWords, null, 2));

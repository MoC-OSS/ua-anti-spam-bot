const fs = require('fs');

const vocabTxt = fs.readFileSync('./temp/vocab.txt').toString();
const vocabJson = vocabTxt
  .trim()
  .split('\n')
  .map((row) => row.split(' ')[0]);

fs.writeFileSync('./temp/vocab.json', JSON.stringify(vocabJson, null, 2));

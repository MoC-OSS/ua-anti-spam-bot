const fs = require('fs');
const path = require('path');

const datasetPath = './strings';
const files = fs.readdirSync(datasetPath).map((filePath) => `./${path.join(datasetPath, filePath)}`);

const types = {
  ALPHABET: 'alphabet',
  SHORTEST: 'shortest',
};

const type = types.ALPHABET;

const sortShortest = (a, b) =>
  // ASC  -> a.length - b.length
  // DESC -> b.length - a.length
  b.length - a.length;

const sortAlphabet = (a, b) => {
  if (a < b) {
    return -1;
  }

  if (a > b) {
    return 1;
  }

  return 0;
};

files.forEach((filePath) => {
  // eslint-disable-next-line global-require,import/no-dynamic-require
  const datasetFile = require(filePath);

  switch (type) {
    case types.SHORTEST:
      datasetFile.sort(sortShortest);
      break;

    case types.ALPHABET:
      datasetFile.sort(sortAlphabet);
      break;

    default:
      throw new Error(`Unknown type: ${type}. Use one of these: ${Object.values(types)}`);
  }

  fs.writeFileSync(filePath, `${JSON.stringify(datasetFile, null, 2)}\n`);
});

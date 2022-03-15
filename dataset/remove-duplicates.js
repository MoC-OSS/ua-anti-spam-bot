const fs = require('fs');
const path = require('path');

const datasetPath = './strings';
const files = fs.readdirSync(datasetPath).map((filePath) => `./${path.join(datasetPath, filePath)}`);

function removeDuplicates(array) {
  return [...new Set(array)];
}

files.forEach((filePath) => {
  // eslint-disable-next-line global-require,import/no-dynamic-require
  const datasetFile = removeDuplicates(require(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(datasetFile, null, 2)}\n`);
});

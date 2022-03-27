const fs = require('fs');
const path = require('path');

function removeDuplicates(array) {
  return [...new Set(array)];
}

const datasetPaths = ['./strings', './cases'];

datasetPaths.forEach((datasetPath) => {
  const files = fs
    .readdirSync(datasetPath)
    .filter((file) => file.split('.').splice(-1)[0] === 'json')
    .map((filePath) => `./${path.join(datasetPath, filePath)}`);

  files.forEach((filePath) => {
    // eslint-disable-next-line global-require,import/no-dynamic-require
    const datasetFile = removeDuplicates(require(filePath));
    fs.writeFileSync(filePath, `${JSON.stringify(datasetFile, null, 2)}\n`);
  });
});

const fs = require('fs');
const path = require('path');

const datasetPath = path.join(__dirname, './strings');
const files = fs.readdirSync(datasetPath);
const filePaths = files.map((filePath) => path.join(datasetPath, filePath));
const fileKey = files.map((file) => file.split('.')[0]);

const dataset = {};

filePaths.forEach((filePath, index) => {
  // eslint-disable-next-line global-require,import/no-dynamic-require
  dataset[fileKey[index]] = require(filePath);
});

module.exports = {
  dataset,
};

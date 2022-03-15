const fs = require('fs');
const path = require('path');

const CyrillicToTranslit = require('cyrillic-to-translit-js');

const datasetPath = path.join(__dirname, './strings');
const files = fs.readdirSync(datasetPath);
const filePaths = files.map((filePath) => path.join(datasetPath, filePath));
const fileKey = files.map((file) => file.split('.')[0]);

const cyrillicToTranslit = new CyrillicToTranslit();

const dataset = {};

/**
 * Import all datasets
 * */
console.info('*0 Initing dataset...');
filePaths.forEach((filePath, index) => {
  const datasetName = fileKey[index];
  // eslint-disable-next-line global-require,import/no-dynamic-require
  dataset[datasetName] = require(filePath);
});

/**
 * Add translit
 * */
console.info('*0 Add translit...');
Object.keys(dataset).forEach((key) => {
  const translitDataset = dataset[key].map((word) => cyrillicToTranslit.transform(word, ' '));
  dataset[key] = [...dataset[key], ...translitDataset];
});

console.info('*0 Dataset is ready.');

module.exports = {
  dataset,
};

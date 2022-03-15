const fs = require('fs');
const path = require('path');

const CyrillicToTranslit = require('cyrillic-to-translit-js');

const datasetPath = path.join(__dirname, './strings');
const files = fs.readdirSync(datasetPath);
const filePaths = files.map((filePath) => path.join(datasetPath, filePath));
const fileKey = files.map((file) => file.split('.')[0]);

const translitRus = new CyrillicToTranslit({ preset: 'ru' });
const translitUa = new CyrillicToTranslit({ preset: 'uk' });

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
  const translitRussianDataset = dataset[key].map((word) => translitRus.transform(word, ' '));
  const translitUkrainianDataset = dataset[key].map((word) => translitUa.transform(word, ' '));

  dataset[key] = [...dataset[key], ...translitUkrainianDataset, ...translitRussianDataset];
});

console.info('*0 Dataset is ready.');

module.exports = {
  dataset,
};

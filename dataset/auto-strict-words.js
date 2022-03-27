const fs = require('fs');

const locations = require('./strings/locations.json');
const strictLocations = require('./strings/strict_locations.json');

const highRisk = require('./strings/high_risk.json');
const strictHighRisk = require('./strings/strict_high_risk.json');

const symbolsCount = 5;

function processDataset(fullDataset, strictDataset) {
  const newFullDataset = fullDataset.filter((item) => item.length > symbolsCount);
  const shortDataset = fullDataset.filter((item) => item.length <= symbolsCount);

  const newStrictDataset = [...shortDataset, ...strictDataset];

  return {
    newFullDataset,
    newStrictDataset,
  };
}

const locationsResult = processDataset(locations, strictLocations);
const highRiskResult = processDataset(highRisk, strictHighRisk);

fs.writeFileSync('./strings/locations.json', `${JSON.stringify(locationsResult.newFullDataset, null, 2)}\n`);
fs.writeFileSync('./strings/strict_locations.json', `${JSON.stringify(locationsResult.newStrictDataset, null, 2)}\n`);

fs.writeFileSync('./strings/high_risk.json', `${JSON.stringify(highRiskResult.newFullDataset, null, 2)}\n`);
fs.writeFileSync('./strings/strict_high_risk.json', `${JSON.stringify(highRiskResult.newStrictDataset, null, 2)}\n`);

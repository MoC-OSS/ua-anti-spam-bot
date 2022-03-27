const fs = require('fs');

const strictLocations = require('./strings/strict_locations.json');
const locations = require('./strings/locations.json');

const strictHighRisk = require('./strings/strict_high_risk.json');
const highRisk = require('./strings/high_risk.json');

const strictPercent100 = require('./strings/strict_percent_100.json');
const percent100 = require('./strings/percent_100.json');

const smartRemoveDuplicates = (mainArray, duplicateArrays) =>
  mainArray.filter((word) => !duplicateArrays.flat().some((item) => item.toLowerCase() === word.toLowerCase()));

const writeFile = (path, json) => {
  fs.writeFileSync(path, `${JSON.stringify(json, null, 2)}\n`);
};

const newPercent100 = smartRemoveDuplicates(percent100, [strictPercent100]);
const newHighRisk = smartRemoveDuplicates(highRisk, [strictHighRisk, newPercent100, strictPercent100]);
const newLocations = smartRemoveDuplicates(locations, [strictLocations]);

writeFile('./strings/percent_100.json', newPercent100);
writeFile('./strings/high_risk.json', newHighRisk);
writeFile('./strings/locations.json', newLocations);

const fs = require('fs');

const locations = require('./strings/locations.json');
const strictLocations = require('./strings/strict_locations.json');

const symbolsCount = 5;

const newFullLocations = locations.filter((location) => location.length > symbolsCount);
const shortLocations = locations.filter((location) => location.length <= symbolsCount);
const newStrictLocations = [...shortLocations, ...strictLocations];

fs.writeFileSync('./strings/locations.json', `${JSON.stringify(newFullLocations, null, 2)}\n`);
fs.writeFileSync('./strings/strict_locations.json', `${JSON.stringify(newStrictLocations, null, 2)}\n`);

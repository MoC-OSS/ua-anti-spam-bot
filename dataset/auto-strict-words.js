const fs = require('fs');

const locations = require('./strings/locations.json');
const strictLocations = require('./strings/strict_locations.json');

const newFullLocations = locations.filter((location) => location.length > 5);
const newShortLocations = [...locations.filter((location) => location.length <= 5), ...strictLocations];

fs.writeFileSync('./strings/locations.json', `${JSON.stringify(newFullLocations, null, 2)}\n`);
fs.writeFileSync('./strings/strict_locations.json', `${JSON.stringify(newShortLocations, null, 2)}\n`);

require('./dataset-sort');

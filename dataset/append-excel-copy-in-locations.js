const fs = require('fs');

const locations = require('./strings/locations.json');
// eslint-disable-next-line import/no-unresolved
const parsedLocations = require('./temp/parse.json');

const newLocations = [...parsedLocations, ...locations];

fs.writeFileSync('./strings/locations.json', `${JSON.stringify(newLocations, null, 2)}\n`);

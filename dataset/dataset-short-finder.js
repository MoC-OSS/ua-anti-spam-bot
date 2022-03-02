const fs = require('fs');

const arr = require('./rules.json');

const newLocations = arr.dataset.high_risk.sort(
  (a, b) =>
    // ASC  -> a.length - b.length
    // DESC -> b.length - a.length
    b.length - a.length,
);

fs.writeFileSync('./sort-locations.json', JSON.stringify(newLocations, null, 2));

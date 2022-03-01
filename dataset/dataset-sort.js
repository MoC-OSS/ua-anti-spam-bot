const fs = require('fs');

const arr = require('./rules.json');

arr.dataset.locations.sort(
  (a, b) =>
    // ASC  -> a.length - b.length
    // DESC -> b.length - a.length
    b.length - a.length,
);

arr.dataset.short_locations.sort(
  (a, b) =>
    // ASC  -> a.length - b.length
    // DESC -> b.length - a.length
    b.length - a.length,
);

arr.dataset.high_risk.sort(
  (a, b) =>
    // ASC  -> a.length - b.length
    // DESC -> b.length - a.length
    b.length - a.length,
);

arr.dataset.percent_100.sort(
  (a, b) =>
    // ASC  -> a.length - b.length
    // DESC -> b.length - a.length
    b.length - a.length,
);

fs.writeFileSync('./sort-locations.json', JSON.stringify(arr, null, 2));

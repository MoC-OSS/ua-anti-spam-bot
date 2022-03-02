const fs = require('fs');

const arr = require('./rules.json');

const sortRule = (a, b) => {
  if (a < b) {
    return -1;
  }

  if (a > b) {
    return 1;
  }

  return 0;
};

arr.dataset.locations.sort(sortRule);
arr.dataset.short_locations.sort(sortRule);
arr.dataset.high_risk.sort(sortRule);
arr.dataset.percent_100.sort(sortRule);
arr.dataset.strict_percent_100.sort(sortRule);

fs.writeFileSync('./rules.json', `${JSON.stringify(arr, null, 2)}\n`);

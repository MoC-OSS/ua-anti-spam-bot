const fs = require('fs');

const highRisk = require('./strings/high_risk.json');
// eslint-disable-next-line import/no-unresolved
const parsedHighRisk = require('./temp/parse.json');

const newHighRisk = [...parsedHighRisk, ...highRisk];

fs.writeFileSync('./strings/high_risk.json', `${JSON.stringify(newHighRisk, null, 2)}\n`);

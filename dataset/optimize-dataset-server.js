const fs = require('fs');
const path = require('path');

const express = require('express');
// eslint-disable-next-line import/no-extraneous-dependencies
const cors = require('cors');
const { env } = require('typed-dotenv').config();

const { googleService } = require('../src/services/google.service');

// eslint-disable-next-line import/no-unresolved
const optimizeResult = require('./temp/optimize-result.json');

const app = express();

app.use(express.json());
app.use(cors());

app.get('/optimize', (req, res) => {
  res.json(optimizeResult);
});

app.post('/remove', (req, res) => {
  const { range, index, negativeIndex, type } = req.body;

  if (type === 'positive') {
    optimizeResult[index].positive.resolved = true;
  } else {
    optimizeResult[index].negativesMatch[negativeIndex].resolved = true;
  }

  fs.writeFileSync(path.join(__dirname, './temp/optimize-result.json'), JSON.stringify(optimizeResult, null, 2));

  googleService.removeSheetRange(env.GOOGLE_SPREADSHEET_ID, range).then(() => {
    res.send({ status: 'ok' });
  });
});

app.listen(3050);

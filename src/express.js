const express = require('express');
const { error, env } = require('typed-dotenv').config();

const { processHandler } = require('./express/process.handler');

const app = express();
const expressStartTime = new Date().toString();

if (error) {
  console.error('Something wrong with env variables');
  process.exit();
}

app.use(express.json());
app.get('/healthcheck', (req, res) => res.json({ status: 'ok' }));
app.post('/process', (req, res) => {
  const startTime = performance.now();
  const { message, datasetPath, strict } = req.body;

  const result = processHandler.processHandler(message, datasetPath, strict);
  const endTime = performance.now();
  const time = endTime - startTime;

  if (env.DEBUG) {
    console.info({ result, time, expressStartTime });
  }

  res.json({ result, time, expressStartTime });
});

app.listen(env.PORT, env.HOST, () => {
  console.info(`App started on http://locahost:${env.PORT}`);
});

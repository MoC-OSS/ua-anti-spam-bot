const express = require('express');

const app = express();

app.use(express.json());
app.post('/process', (req, res) => {
  // console.log(req.body.message);
  // const result = messageUtil.findInText(req.body.message);
  const result = true;
  res.json({ result });
});

app.listen(3000);

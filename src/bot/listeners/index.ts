const onTextExports = require('./on-text.listener');
const testTensorExports = require('./test-tensor.listener');

module.exports = {
  ...onTextExports,
  ...testTensorExports,
};

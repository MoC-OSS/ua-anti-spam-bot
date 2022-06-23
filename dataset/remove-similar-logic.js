const stringSimilarity = require('string-similarity');

module.exports = ({ first, second, rate }, callback) => {
  const result = stringSimilarity.compareTwoStrings(first, second);
  callback({ result, rate, isSame: result > rate });
};

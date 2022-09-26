export function generateRandomNumber(digits) {
  return Math.floor(Math.random() * 10 ** digits);
}

export function generateRandomString(length) {
  return Buffer.from(Math.random().toString()).toString('base64').substr(10, length);
}

export function generateRandomBoolean() {
  return Math.random() < 0.5;
}

module.exports = {
  generateRandomNumber,
  generateRandomString,
  generateRandomBoolean,
};

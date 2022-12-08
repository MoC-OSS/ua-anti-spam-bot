export function generateRandomNumber(digits: number) {
  return Math.floor(Math.random() * 10 ** digits);
}

export function generateRandomString(length: number) {
  // eslint-disable-next-line unicorn/prefer-string-slice
  return Buffer.from(Math.random().toString()).toString('base64').substr(10, length);
}

export function generateRandomBoolean() {
  return Math.random() < 0.5;
}

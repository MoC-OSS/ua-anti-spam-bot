export function generateRandomNumber(digits: number) {
  // eslint-disable-next-line sonarjs/pseudo-random
  return Math.floor(Math.random() * 10 ** digits);
}

export function generateRandomString(length: number) {
  // eslint-disable-next-line unicorn/prefer-string-slice, sonarjs/pseudo-random, sonarjs/deprecation
  return Buffer.from(Math.random().toString()).toString('base64').substr(10, length);
}

export function generateRandomBoolean() {
  // eslint-disable-next-line sonarjs/pseudo-random
  return Math.random() < 0.5;
}

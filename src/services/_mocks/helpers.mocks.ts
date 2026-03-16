/**
 * Generates a random integer with the given number of digits.
 * @param digits - number of digits for the generated number
 * @returns random integer up to 10^digits
 */
export function generateRandomNumber(digits: number) {
  // eslint-disable-next-line sonarjs/pseudo-random
  return Math.floor(Math.random() * 10 ** digits);
}

/**
 * Generates a random Base64-encoded string of the specified length.
 * @param length - number of characters to return
 * @returns random string of the given length
 */
export function generateRandomString(length: number) {
  // eslint-disable-next-line unicorn/prefer-string-slice, sonarjs/pseudo-random, sonarjs/deprecation
  return Buffer.from(Math.random().toString()).toString('base64').substr(10, length);
}

/**
 * Generates a random boolean value.
 * @returns true or false with equal probability
 */
export function generateRandomBoolean() {
  // eslint-disable-next-line sonarjs/pseudo-random
  return Math.random() < 0.5;
}

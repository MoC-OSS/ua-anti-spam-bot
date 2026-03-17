/**
 * @module csv.util
 * @description Utility functions for generating CSV files from columnar data.
 * Produces Grammy InputFile objects ready to send as Telegram documents.
 */

import { InputFile } from 'grammy';

/**
 * Sanitizes a value for CSV output by stripping special characters.
 * @param value - The raw string value to sanitize
 * @returns The sanitized value wrapped in double quotes
 */
function processCsvValue(value: string) {
  return `"${value
    .replaceAll(/[^\da-z\u0400-\u04FF]/gi, ' ')
    .replaceAll(/\s\s+/g, ' ')
    .trim()}"`;
}

/**
 * Converts column arrays into a 2D row-major CSV matrix with headers.
 * @param headers - Array of column header names
 * @param columns - Array of column data arrays
 * @returns A 2D array of strings in row-major order with headers as the first row
 */
function toCsvRows(headers: string[], columns: string[][]) {
  const output = [headers];
  // eslint-disable-next-line unicorn/no-array-reduce, sonarjs/reduce-initial-value
  const numberRows = columns.map((column) => column.length).reduce((left, right) => Math.max(left, right));

  for (let row = 0; row < numberRows; row += 1) {
    // eslint-disable-next-line security/detect-object-injection
    output.push(columns.map((column) => (column[row] ? processCsvValue(column[row]) : '')));
  }

  return output;
}

/**
 * Serializes a 2D string array into CSV format.
 * @param csvData - A 2D array of strings representing rows and columns
 * @returns A CSV-formatted string with newlines between rows
 */
function toCsvString(csvData: string[][]) {
  let output = '';

  // eslint-disable-next-line no-return-assign
  csvData.forEach((row) => (output += `${row.join(',')}\n`));

  return output;
}

/**
 * Creates a Grammy InputFile from columnar data for sending as a Telegram document.
 * @param headers - Array of column header names
 * @param columns - Array of column data arrays
 * @param fileName - The base file name (without extension) for the generated CSV file
 * @returns A Grammy InputFile containing the CSV data, ready to send as a Telegram document
 */
export function csvConstructor(headers: string[], columns: string[][], fileName: string): InputFile {
  const csvString = toCsvString(toCsvRows(headers, columns));

  return new InputFile(Buffer.from(csvString), `${fileName}.csv`);
}

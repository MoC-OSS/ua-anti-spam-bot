import { InputFile } from 'grammy';

function processCsvValue(value: string) {
  return `"${value
    .replaceAll(/[^\da-z\u0400-\u04FF]/gi, ' ')
    .replaceAll(/\s\s+/g, ' ')
    .trim()}"`;
}

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

function toCsvString(csvData: string[][]) {
  let output = '';

  // eslint-disable-next-line no-return-assign
  csvData.forEach((row) => (output += `${row.join(',')}\n`));

  return output;
}

export function csvConstructor(headers: string[], columns: string[][], fileName: string): InputFile {
  const csvString = toCsvString(toCsvRows(headers, columns));

  return new InputFile(Buffer.from(csvString), `${fileName}.csv`);
}

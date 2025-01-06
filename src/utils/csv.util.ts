import { InputFile } from 'grammy';

function processCsvValue(value: string) {
  return `"${value
    .replaceAll(/[^\da-z\u0400-\u04FF]/gi, ' ')
    .replaceAll(/\s\s+/g, ' ')
    .trim()}"`;
}

function toCsvRows(headers: string[], columns: string[][]) {
  const output = [headers];
  // eslint-disable-next-line unicorn/no-array-reduce
  const numberRows = columns.map((col) => col.length).reduce((a, b) => Math.max(a, b));
  for (let row = 0; row < numberRows; row += 1) {
    output.push(columns.map((c) => (c[row] ? processCsvValue(c[row]) : '')));
  }
  return output;
}

function toCsvString(data: string[][]) {
  let output = '';
  // eslint-disable-next-line no-return-assign
  data.forEach((row) => (output += `${row.join(',')}\n`));
  return output;
}

export function csvConstructor(headers: string[], columns: string[][], fileName: string): InputFile {
  const csvString = toCsvString(toCsvRows(headers, columns));
  return new InputFile(Buffer.from(csvString), `${fileName}.csv`);
}

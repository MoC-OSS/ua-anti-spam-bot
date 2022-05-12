/**
 * Data from:
 * http://services.ukrposhta.com/postindex_new/upload/houses.zip
 *
 * Encoding need to be changed manually from WIN-1251 to UTF-8
 * */

const fs = require('fs');
const path = require('path');

const file = fs.readFileSync(path.join(__dirname, './temp/houses.csv')).toString();
const addressArray = file.split('\r\n');

const streetArray = addressArray
  .slice(1)
  .map((address) => address.split(';')?.[6])
  .filter(Boolean);

const clearStreetArrayAll = streetArray
  .map((val) => {
    let str = val;
    // replace latin symbols to cyrillic
    str = str.replace(/A/g, 'А');
    str = str.replace(/B/g, 'В');
    str = str.replace(/E/g, 'Е');
    str = str.replace(/K/g, 'К');
    str = str.replace(/M/g, 'М');
    str = str.replace(/H/g, 'Н');
    str = str.replace(/O/g, 'О');
    str = str.replace(/P/g, 'Р');
    str = str.replace(/C/g, 'С');
    str = str.replace(/T/g, 'Т');
    str = str.replace(/X/g, 'Х');
    str = str.replace(/a/g, 'а');
    str = str.replace(/e/g, 'е');
    str = str.replace(/i/g, 'і');
    str = str.replace(/o/g, 'о');
    str = str.replace(/p/g, 'р');
    str = str.replace(/c/g, 'с');
    str = str.replace(/y/g, 'у');
    str = str.replace(/x/g, 'х');

    // further text processing...
    str = str.replace(/^.*?\s+\s*(.+)$/i, '$1');
    str = str.replace(
      /^(?:\d*\s*(?:км|ї|ст|кст|га|го)\s+|.*-\s*(?:ї|а|ої|го|чя|я|й|ий|ій|ии|и|річчя|річя|річча|річа|га|ша|ти)|\d*-|\d+)\s*(.+)$/i,
      '$1',
    );
    str = str.replace(/\d+-га$|\d+-ша$/, '');
    str = str.replace(/\s*\(.*?\)\s*/, '');
    str = str.replace(/^"\.*|\.*"$|\s+"\.*/g, ' ');
    str = str.replace(/\s+\d+-й|\s+\d+-ї|\s+\d+-a|\s+-\s*\d/gi, '');
    str = str.replace(/[\s\S]*відс[\s\S]*тн[\s\S]*/gi, '');
    str = str.replace(/[\s\S]*без\s+вулиц[\s\S]*/gi, '');
    str = str.replace(/[\s\S]*без\s+назв[\s\S]*/gi, '');
    str = str.replace(/б\/н/gi, '');
    str = str.replace(/ж\/д/gi, '');

    str = str.replace(/^річчя\s+|\s+річчя$|\s+річчя\s+|^річчя$/gi, '');
    str = str.replace(/^річя\s+|\s+річя$|\s+річя\s+|^річя$/gi, '');
    str = str.replace(/^річча\s+|\s+річча$|\s+річча|^річча$\s+/gi, '');
    str = str.replace(/^річа\s+|\s+річа$|\s+річа\s+|^річа$/gi, '');
    str = str.replace(/^жд\s+|\s+жд$|\s+жд\s+/gi, '');
    str = str.replace(/^км\s+|\s+км$|\s+км\s+/gi, '');
    str = str.replace(/^ррс\s+|\s+ррс$|\s+ррс\s+/gi, '');
    str = str.replace(/^пзз\s+|\s+пзз$|\s+пзз\s+/gi, '');

    str = str.replace(/^ім\.|\s+ім\./gi, '');
    str = str.replace(/ім\.105-ти/gi, '');
    str = str.replace(/NULL/gi, '');
    str = str.replace(/вул\./gi, '');
    str = str.replace(/.{1}\./gi, '');
    str = str.replace(/ІІІ/gi, '');
    str = str.replace(/ІІ/gi, '');
    str = str.replace(/V/gi, '');
    str = str.replace(/\d/gi, '');
    str = str.replace(/\s+І{1,3}\s+|\s+І{1,3}\s+|^І{1,3}\s+|\s+І{1,3}$/gi, '');
    str = str.replace(/i{1,}/gi, 'і');
    str = str.replace(/\.+/g, '');
    str = str.replace(/"/g, "'");
    str = str.replace(/''/g, '');
    str = str.replace(/'а'/gi, '');
    str = str.replace(/'б'/gi, '');
    str = str.replace(/^-\s*|-\s*$|\s+км\s*$/g, '');
    str = str.replace(/\s-\s/g, '-');
    str = str.replace(/\s-/g, '-');
    str = str.replace(/-\s/g, '-');
    str = str.replace(/,/g, '');
    str = str.replace(/^[\s\S]\s/g, '');
    str = str.replace(/\s+[\s\S]$/g, '');

    str = str.replace(/\s\s+/g, ' ');
    str = str.trim().toLowerCase();

    // leave words with more than 4 characters
    if (str.length < 4) {
      str = '';
    }
    return str;
  })
  .filter((el) => el !== '');

// select distinct values
const clearStreetArray = [...new Set(clearStreetArrayAll)];

// array sort
clearStreetArray.sort((a, b) => a.localeCompare(b));
const jsonContent = JSON.stringify(clearStreetArray);

// save result dataset to the json file
fs.writeFile(path.join(__dirname, './strings/houses.json'), jsonContent, 'utf8', (err) => {
  if (err) {
    return console.error(err);
  }
  console.dir('The file was saved!');
});

/*
// words array to exclude from the streets list
["алея","атаки","баба","воїнів","воїна","войни","війни","войти","вокзал","волі","воля","ворони","вузька","голка","головної","голуби","гора","горіх","горобця","град","граніт","гребінь","гречка","гречки","грибна","гуртожиток","гуртожитки","давня","далека","далекий","далекого","дальній","дальня","дев'ята","джерел","джерела","джерело","дніпро","доби","добра","добрий","довга","другий"]
*/

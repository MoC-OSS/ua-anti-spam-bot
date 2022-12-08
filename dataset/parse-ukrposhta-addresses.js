/**
 * Data from:
 * http://services.ukrposhta.com/postindex_new/upload/houses.zip
 *
 * Encoding need to be changed manually from WIN-1251 to UTF-8
 * */

const fs = require('node:fs');
const path = require('node:path');

const file = fs.readFileSync(path.join(__dirname, './temp/houses.csv')).toString();
const addressArray = file.split('\r\n');

const streetArray = addressArray
  .slice(1)
  .map((address) => address.split(';')?.[6])
  .filter(Boolean);

const clearStreetArrayAll = streetArray
  .map((value) => {
    let string_ = value;
    // replace latin symbols to cyrillic
    string_ = string_.replace(/A/g, 'А');
    string_ = string_.replace(/B/g, 'В');
    string_ = string_.replace(/E/g, 'Е');
    string_ = string_.replace(/K/g, 'К');
    string_ = string_.replace(/M/g, 'М');
    string_ = string_.replace(/H/g, 'Н');
    string_ = string_.replace(/O/g, 'О');
    string_ = string_.replace(/P/g, 'Р');
    string_ = string_.replace(/C/g, 'С');
    string_ = string_.replace(/T/g, 'Т');
    string_ = string_.replace(/X/g, 'Х');
    string_ = string_.replace(/a/g, 'а');
    string_ = string_.replace(/e/g, 'е');
    string_ = string_.replace(/i/g, 'і');
    string_ = string_.replace(/o/g, 'о');
    string_ = string_.replace(/p/g, 'р');
    string_ = string_.replace(/c/g, 'с');
    string_ = string_.replace(/y/g, 'у');
    string_ = string_.replace(/x/g, 'х');

    // further text processing...
    string_ = string_.replace(/^.*?\s+(.+)$/i, '$1');
    string_ = string_.replace(
      /^(?:\d*\s*(?:км|ї|ст|кст|га|го)\s+|.*-\s*(?:ї|а|ої|го|чя|я|й|ий|ій|ии|и|річчя|річя|річча|річа|га|ша|ти)|\d*-|\d+)\s*(.+)$/i,
      '$1',
    );
    string_ = string_.replace(/\d+-га$|\d+-ша$/, '');
    string_ = string_.replace(/\s*\(.*?\)\s*/, '');
    string_ = string_.replace(/^"\.*|\.*"$|\s+"\.*/g, ' ');
    string_ = string_.replace(/\s+\d+-й|\s+\d+-ї|\s+\d+-a|\s+-\s*\d/gi, '');
    string_ = string_.replace(/[\S\s]*відс[\S\s]*тн[\S\s]*/gi, '');
    string_ = string_.replace(/[\S\s]*без\s+вулиц[\S\s]*/gi, '');
    string_ = string_.replace(/[\S\s]*без\s+назв[\S\s]*/gi, '');
    string_ = string_.replace(/б\/н/gi, '');
    string_ = string_.replace(/ж\/д/gi, '');

    string_ = string_.replace(/^річчя\s+|\s+річчя$|\s+річчя\s+|^річчя$/gi, '');
    string_ = string_.replace(/^річя\s+|\s+річя$|\s+річя\s+|^річя$/gi, '');
    string_ = string_.replace(/^річча\s+|\s+річча$|\s+річча|^річча$\s+/gi, '');
    string_ = string_.replace(/^річа\s+|\s+річа$|\s+річа\s+|^річа$/gi, '');
    string_ = string_.replace(/^жд\s+|\s+жд$|\s+жд\s+/gi, '');
    string_ = string_.replace(/^км\s+|\s+км$|\s+км\s+/gi, '');
    string_ = string_.replace(/^ррс\s+|\s+ррс$|\s+ррс\s+/gi, '');
    string_ = string_.replace(/^пзз\s+|\s+пзз$|\s+пзз\s+/gi, '');

    string_ = string_.replace(/^ім\.|\s+ім\./gi, '');
    string_ = string_.replace(/ім\.105-ти/gi, '');
    string_ = string_.replace(/null/gi, '');
    string_ = string_.replace(/вул\./gi, '');
    string_ = string_.replace(/.\./gi, '');
    string_ = string_.replace(/ііі/gi, '');
    string_ = string_.replace(/іі/gi, '');
    string_ = string_.replace(/v/gi, '');
    string_ = string_.replace(/\d/gi, '');
    string_ = string_.replace(/\s+і{1,3}\s+|^і{1,3}\s+|\s+і{1,3}$/gi, '');
    string_ = string_.replace(/i+/gi, 'і');
    string_ = string_.replace(/\.+/g, '');
    string_ = string_.replace(/"/g, "'");
    string_ = string_.replace(/''/g, '');
    string_ = string_.replace(/'а'/gi, '');
    string_ = string_.replace(/'б'/gi, '');
    string_ = string_.replace(/^-\s*|-\s*$|\s+км\s*$/g, '');
    string_ = string_.replace(/\s-\s/g, '-');
    string_ = string_.replace(/\s-/g, '-');
    string_ = string_.replace(/-\s/g, '-');
    string_ = string_.replace(/,/g, '');
    string_ = string_.replace(/^[\S\s]\s/g, '');
    string_ = string_.replace(/\s+[\S\s]$/g, '');

    string_ = string_.replace(/\s\s+/g, ' ');
    string_ = string_.trim().toLowerCase();

    // leave words with more than 4 characters
    if (string_.length < 4) {
      string_ = '';
    }
    return string_;
  })
  .filter((element) => element !== '');

// select distinct values
const clearStreetArray = [...new Set(clearStreetArrayAll)];

// array sort
clearStreetArray.sort((a, b) => a.localeCompare(b));
const jsonContent = JSON.stringify(clearStreetArray);

// save result dataset to the json file
fs.writeFile(path.join(__dirname, './strings/houses.json'), jsonContent, 'utf8', (error) => {
  if (error) {
    return console.error(error);
  }
  console.dir('The file was saved!');
});

/*
// words array to exclude from the streets list
["алея","атаки","баба","воїнів","воїна","войни","війни","войти","вокзал","волі","воля","ворони","вузька","голка","головної","голуби","гора","горіх","горобця","град","граніт","гребінь","гречка","гречки","грибна","гуртожиток","гуртожитки","давня","далека","далекий","далекого","дальній","дальня","дев'ята","джерел","джерела","джерело","дніпро","доби","добра","добрий","довга","другий"]
*/

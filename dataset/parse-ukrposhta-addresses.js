/**
 * Data from:
 * http://services.ukrposhta.com/postindex_new/upload/houses.zip
 *
 * Encoding need to be changed manually from WIN-1251 to UTF-8
 * */

const fs = require('fs');

const locationTypes = require('./strings/location_types.json');

const extraWords = ['вулиця відсутня'];

const removeLocations = ['назва відсутня', 'без назви', 'відсутня', 'вулиця відсутня', 'без вулиць', 'без вулиці'];

// const addressRegexp = /^.+;;.+;\d+;([a-z\u0400-\u04FF. \d'-]+);/;

const file = fs.readFileSync('./temp/houses.csv').toString();
const addressArray = file.split('\r\n');

const streetArray = addressArray
  .slice(1)
  .map((address) => address.split(';')?.[6])
  .filter(Boolean);

const removeWords = [...extraWords, ...locationTypes];

// eslint-disable-next-line no-unused-vars
const clearStreetArray = streetArray
  .map((street) => {
    let newStreet = street;

    removeWords.forEach((type) => {
      newStreet = newStreet.replace(type, '').trim();
    });

    return newStreet;
  })
  .filter((street) => !removeLocations.includes(street));
// const i = clearStreetArray.filter((street) => /^[а-я].*/.test(street));
//
// console.log({ i });

// fs.writeFileSync('./strings/all_locations.json', JSON.stringify(clearStreetArray, null, 2));

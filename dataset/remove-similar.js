/* eslint-disable import/no-extraneous-dependencies */
const queue = require('queue');
const workerFarm = require('worker-farm');

const workers = workerFarm(require.resolve('./remove-similar-logic.js'));

const prepareArray = (array) => (array[0].value ? array : array.filter(Boolean).map((value) => ({ value, label: value })));

const removeSimilar = async (array, compareRate = 0.7) => {
  const filteredArray = prepareArray(array);

  return new Promise((resolve) => {
    const q = queue({ results: [], timeout: 0, concurrency: 6000 });

    filteredArray.forEach((first, firstIndex, self) => {
      q.push(async () => {
        if (firstIndex % 100 === 0) {
          console.info(firstIndex, 'of', filteredArray.length, ((firstIndex / filteredArray.length) * 100).toFixed(2), '%');
        }

        for (let secondIndex = 0; secondIndex < self.length; secondIndex += 1) {
          const second = self[secondIndex];
          const compareOptions = {
            first: first.value,
            second: second.value,
            rate: compareRate,
          };

          // eslint-disable-next-line no-await-in-loop
          const { isSame, result } = await new Promise((workerResolve) => {
            workers(compareOptions, workerResolve);
          });

          if (isSame) {
            if (secondIndex === firstIndex) {
              return { first, unique: true };
            }
            return {
              first,
              second,
              result,
              unique: false,
            };
          }
        }

        return { first, unique: true };
      });

      if (firstIndex === filteredArray.length - 1) {
        q.start((err) => {
          if (err) throw err;
          console.info('all done:', q.results);
          workerFarm.end(workers);

          resolve(q.results);
        });
      }
    });
  });
};

module.exports = {
  removeSimilar,
};

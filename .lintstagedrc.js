const path = require('path');

const getLintFlags = (absolutePaths) => {
  const cwd = process.cwd();
  const relativePaths = absolutePaths.map((file) => path.relative(cwd, file));
  /**
   *
   * Some file paths are too long and cannot be added as parameter to eslint
   * https://serverfault.com/questions/9546/filename-length-limits-on-linux/9548#9548
   *
   * */
  const filePathLengthLimit = relativePaths.find((path) => path.length > 250);

  /**
   *
   * There is a case, when the command is too long and eslint cannot execute it.
   *
   * */
  const isTooManyFilesToLint = relativePaths.length > 20;

  return {
    relativePaths,
    filePathLengthLimit,
    isTooManyFilesToLint,
  };
};

module.exports = {
  '**/*.{js,ts}': (absolutePaths) => {
    const { filePathLengthLimit, isTooManyFilesToLint, relativePaths } = getLintFlags(absolutePaths);

    if (filePathLengthLimit || isTooManyFilesToLint) {
      return 'npm run lint:js';
    }

    return `eslint ${relativePaths.join(' ')}`;
  },
  '**/*.{css,scss}': (absolutePaths) => {
    const { filePathLengthLimit, isTooManyFilesToLint, relativePaths } = getLintFlags(absolutePaths);

    if (filePathLengthLimit || isTooManyFilesToLint) {
      return 'npm run lint:styles';
    }

    return `stylelint ${relativePaths.join(' ')}`;
  },
};

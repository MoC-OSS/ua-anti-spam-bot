/**
 * @param {Error} catchError
 * @param {string} reason
 * */
function handleError(catchError, reason = '') {
  console.error('**** HANDLED ERROR ****', reason, catchError);
}

module.exports = {
  handleError,
};

/**
 * @type {GrammyErrorHandler}
 * */
const handleError = (catchError, reason = '') => {
  console.error('**** HANDLED ERROR ****', reason, catchError);
};

module.exports = {
  handleError,
};

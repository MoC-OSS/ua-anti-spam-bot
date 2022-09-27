/**
 * @type {GrammyErrorHandler}
 * */
export const handleError = (catchError, reason = '') => {
  console.error('**** HANDLED ERROR ****', reason, catchError);
};

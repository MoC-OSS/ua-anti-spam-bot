/**
 * Delete user entered message
 *
 * @param {GrammyContext} ctx
 * @param {Next} next
 * */
function deleteMessageMiddleware(ctx, next) {
  return ctx
    .deleteMessage()
    .then(next)
    .catch(() => {});
}

module.exports = {
  deleteMessageMiddleware,
};

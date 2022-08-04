/**
 * Reveals real link that were used in the message
 *
 * @param {GrammyContext} ctx
 *
 * @returns string
 * */
function revealHiddenUrls(ctx) {
  let { text } = ctx.state;
  const entities = ctx.msg?.entities;

  function cutInHiddenUrls(str, cutStart, cutEnd, url) {
    return str.substr(0, cutStart) + url + str.substr(cutEnd);
  }

  if (entities) {
    let additionalUrlsLength = 0;
    let deletedTextLength = 0;
    entities.forEach((entity) => {
      if (entity.type === 'text_link') {
        const { offset } = entity;
        const { length } = entity;
        const hiddenUrl = entity.url;
        if (additionalUrlsLength <= 0) {
          text = cutInHiddenUrls(text, offset, offset + length, hiddenUrl);
        } else {
          text = cutInHiddenUrls(
            text,
            offset + additionalUrlsLength - deletedTextLength,
            offset + length + additionalUrlsLength - deletedTextLength,
            hiddenUrl,
          );
        }
        deletedTextLength += length;
        additionalUrlsLength += hiddenUrl.length;
      }
    });
  }

  return text;
}

module.exports = {
  revealHiddenUrls,
};

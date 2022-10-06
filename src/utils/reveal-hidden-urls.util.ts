/**
 * Reveals real link that were used in the message
 *
 * @param {GrammyContext} ctx
 *
 * @returns string
 * */
export function revealHiddenUrls(context) {
  let { text } = context.state;
  const entities = context.msg?.entities;

  function cutInHiddenUrls(string_, cutStart, cutEnd, url) {
    return string_.slice(0, Math.max(0, cutStart)) + url + string_.slice(cutEnd);
  }

  if (entities) {
    let additionalUrlsLength = 0;
    let deletedTextLength = 0;
    entities.forEach((entity) => {
      if (entity.type === 'text_link') {
        const { offset } = entity;
        const { length } = entity;
        const hiddenUrl = entity.url;
        text =
          additionalUrlsLength <= 0
            ? cutInHiddenUrls(text, offset, offset + length, hiddenUrl)
            : cutInHiddenUrls(
                text,
                offset + additionalUrlsLength - deletedTextLength,
                offset + length + additionalUrlsLength - deletedTextLength,
                hiddenUrl,
              );
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

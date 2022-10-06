import type { GrammyContext } from '../types';

function cutInHiddenUrls(string_: string | undefined, cutStart: number, cutEnd: number, url: string): string {
  return string_ ? string_.slice(0, Math.max(0, cutStart)) + url + string_.slice(cutEnd) : '';
}

/**
 * Reveals real link that were used in the message
 *
 * @param {GrammyContext} context
 *
 * @returns string
 * */
export function revealHiddenUrls(context: GrammyContext) {
  let { text } = context.state;
  const entities = context.msg?.entities;

  if (entities) {
    let additionalUrlsLength = 0;
    let deletedTextLength = 0;
    entities.forEach((entity) => {
      if (entity.type === 'text_link') {
        const { offset } = entity;
        const { length, url } = entity;
        const hiddenUrl = url;
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

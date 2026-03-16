import type { GrammyContext } from '@app-types/context';

/**
 * Replaces a hidden-URL text span in the input string with the actual URL.
 * @param inputString - The message text to modify
 * @param cutStart - The start offset of the text span to replace
 * @param cutEnd - The end offset of the text span to replace
 * @param url - The actual URL to insert in place of the hidden text
 * @returns The modified string with the hidden URL revealed, or an empty string if input is undefined
 */
function cutInHiddenUrls(inputString: string | undefined, cutStart: number, cutEnd: number, url: string): string {
  return inputString ? inputString.slice(0, Math.max(0, cutStart)) + url + inputString.slice(cutEnd) : '';
}

/**
 * Reveals real link that were used in the message
 * @param context - The Grammy context object containing the message text and entities
 * @returns string
 */
export function revealHiddenUrls(context: GrammyContext): string {
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

  return text!;
}

/* eslint-disable no-restricted-syntax,no-await-in-loop */
const { mentionRegexp, urlRegexp, removeExtraSpaces } = require('ukrainian-ml-optimizer');

// eslint-disable-next-line import/no-unresolved
const deleteFromMessage = require('./from-entities.json');

/**
 * @param {API} api
 * @param {any} chatPeer - TODO add defined type
 * @param {TensorService} tensorService
 * @param {ProtoUpdate} updateInfo
 * @param {UserbotStorage} userbotStorage
 * */
module.exports = async (api, chatPeer, tensorService, updateInfo, userbotStorage) => {
  const allowedTypes = ['updateEditChannelMessage', 'updateNewChannelMessage'];

  const newMessageUpdates = updateInfo.updates.filter(
    (anUpdate) =>
      allowedTypes.includes(anUpdate._) && anUpdate.message?.message && anUpdate.message.peer_id?.channel_id !== chatPeer.channel_id,
  );
  if (!newMessageUpdates || newMessageUpdates.length === 0) {
    return;
  }

  for (const update of newMessageUpdates) {
    let clearMessageText = update.message.message;

    const mentions = clearMessageText.match(mentionRegexp);
    const urls = clearMessageText.match(urlRegexp);

    const telegramLinks = [...(mentions || []), ...(urls || [])];

    clearMessageText = clearMessageText.replace(mentionRegexp, ' ');
    clearMessageText = clearMessageText.replace(urlRegexp, ' ');

    deleteFromMessage.forEach((deleteWord) => {
      clearMessageText = removeExtraSpaces(clearMessageText.replace(deleteWord, ' '));
    });

    if (clearMessageText.split(' ').length > 50) {
      console.info(null, 'Skip', clearMessageText);
      return;
    }

    const { isSpam, spamRate } = await tensorService.predict(clearMessageText, 0.5);
    console.info(isSpam, spamRate, update.message.message);

    if (isSpam) {
      const isNew = userbotStorage.handleMessage(clearMessageText);

      if (telegramLinks.length) {
        telegramLinks.forEach((mention) => {
          if (!deleteFromMessage.includes(mention)) {
            api.call('messages.sendMessage', {
              message: mention,
              random_id: Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
              peer: {
                _: 'inputPeerSelf',
              },
            });
          }
        });
      }

      if (isNew) {
        await api.call('messages.sendMessage', {
          message: clearMessageText,
          random_id: Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
          peer: chatPeer,
        });
      }
    }
  }
};

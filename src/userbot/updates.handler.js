/* eslint-disable no-restricted-syntax,no-await-in-loop */
const { userbotStorage } = require('./storage.handler');
// eslint-disable-next-line import/no-unresolved
const deleteFromMessage = require('./from-entities.json');

/**
 * @param {API} api
 * @param {any} chatPeer - TODO add defined type
 * @param {TensorService} tensorService
 * @param {ProtoUpdate} updateInfo
 * */
module.exports = async (api, chatPeer, tensorService, updateInfo) => {
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

    deleteFromMessage.forEach((deleteWord) => {
      clearMessageText = clearMessageText.replace(deleteWord, ' ').trim();
    });

    if (clearMessageText.split(' ').length > 50) {
      console.info(null, 'Skip', clearMessageText);
      return;
    }

    const { isSpam } = await tensorService.predict(clearMessageText, 0.7);
    console.info(isSpam, update.message.message);

    if (isSpam) {
      const isNew = userbotStorage.handleMessage(clearMessageText);

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

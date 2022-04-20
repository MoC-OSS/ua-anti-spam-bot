/* eslint-disable no-restricted-syntax,no-await-in-loop */

const { userbotStorage } = require('./storage.handler');
/**
 * @param {API} api
 * @param {any} chatPeer - TODO add defined type
 * @param {TensorService} tensorService
 * @param {ProtoUpdate} updateInfo
 * */
module.exports = async (api, chatPeer, tensorService, updateInfo) => {
  console.info('New updates', updateInfo.updates);

  const allowedTypes = ['updateEditChannelMessage', 'updateNewChannelMessage'];

  const newMessageUpdates = updateInfo.updates.filter(
    (anUpdate) =>
      allowedTypes.includes(anUpdate._) && anUpdate.message?.message && anUpdate.message.peer_id?.channel_id !== chatPeer.channel_id,
  );
  if (!newMessageUpdates || newMessageUpdates.length === 0) {
    return;
  }

  console.info('Filtered updates', updateInfo.updates);

  for (const update of newMessageUpdates) {
    const messageText = update.message.message;

    const { isSpam } = await tensorService.predict(messageText, 0.7);
    console.info(isSpam, update.message.message);

    if (isSpam) {
      const isNew = userbotStorage.handleMessage(messageText);

      if (isNew) {
        await api.call('messages.sendMessage', {
          message: update.message.message,
          // random_id: Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
          peer: chatPeer,
        });
      }
    }
  }
};

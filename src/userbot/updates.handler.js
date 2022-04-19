/* eslint-disable no-restricted-syntax,no-await-in-loop */

/**
 * @param {API} api
 * @param {any} chatPeer - TODO add defined type
 * @param {TensorService} tensorService
 * @param {ProtoUpdate} updateInfo
 * */
module.exports = async (api, chatPeer, tensorService, updateInfo) => {
  console.info(updateInfo.updates);

  const allowedTypes = ['updateEditChannelMessage', 'updateNewChannelMessage'];

  const newMessageUpdates = updateInfo.updates.filter((anUpdate) => allowedTypes.includes(anUpdate._) && anUpdate.message?.message);
  if (!newMessageUpdates || newMessageUpdates.length === 0) {
    return;
  }

  for (const update of newMessageUpdates) {
    const messageText = update.message.message;

    const { isSpam } = await tensorService.predict(messageText, 0.7);
    console.info(isSpam, update.message.message);

    if (isSpam) {
      await api.call('messages.sendMessage', {
        message: update.message.message,
        random_id: Math.floor(Math.random() * 1000),
        peer: chatPeer,
      });
    }
  }
};

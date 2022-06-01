/* eslint-disable no-restricted-syntax,no-await-in-loop */
const fs = require('fs');
const path = require('path');

const stringSimilarity = require('string-similarity');
const { mentionRegexp, urlRegexp, optimizeText } = require('ukrainian-ml-optimizer');

// eslint-disable-next-line import/no-unresolved
const deleteFromMessage = require('./from-entities.json');
const { dataset } = require('../../dataset/dataset');

const sentMentionsFromStart = [];

const SWINDLER_SETTINGS = {
  DELETE_CHANCE: 0.8,
  LOG_CHANGE: 0.5,
};

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
      clearMessageText = clearMessageText.replace(deleteWord, ' ');
    });

    clearMessageText = clearMessageText.replace(/  +/g, ' ').split(' ').slice(0, 15).join(' ');

    const { isSpam, spamRate } = await tensorService.predict(clearMessageText, 0.7);
    console.info(isSpam, spamRate, update.message.message);

    let lastChance = 0;
    let maxChance = 0;
    const foundSwindler = dataset.swindlers.some((text) => {
      lastChance = stringSimilarity.compareTwoStrings(optimizeText(clearMessageText), text);

      if (lastChance > maxChance) {
        maxChance = lastChance;
      }

      return lastChance >= SWINDLER_SETTINGS.LOG_CHANGE;
    });

    const isHelp = clearMessageText.toLowerCase().includes('допомог');

    if (foundSwindler || isHelp) {
      api.call('messages.sendMessage', {
        message: update.message.message,
        random_id: Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
        peer: {
          _: 'inputPeerSelf',
        },
      });
    }

    if (isSpam && spamRate < 0.9) {
      const isNew = userbotStorage.handleMessage(clearMessageText);

      if (telegramLinks.length) {
        telegramLinks.forEach((mention) => {
          if (!deleteFromMessage.includes(mention) && !sentMentionsFromStart.includes(mention)) {
            sentMentionsFromStart.push(mention);
            deleteFromMessage.push(mention);

            fs.writeFileSync(path.join(__dirname, './from-entities.json'), JSON.stringify(deleteFromMessage, null, 2));

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
        await api
          .call('messages.sendMessage', {
            message: clearMessageText,
            random_id: Math.ceil(Math.random() * 0xffffff) + Math.ceil(Math.random() * 0xffffff),
            peer: chatPeer,
          })
          .catch(() => console.error('send message error'));
      }
    }
  }
};

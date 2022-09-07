/* eslint-disable no-restricted-syntax,no-await-in-loop,no-unreachable */
const fs = require('fs');
const path = require('path');

const { mentionRegexp, urlRegexp } = require('ukrainian-ml-optimizer');

// eslint-disable-next-line import/no-unresolved
const deleteFromMessage = require('./from-entities.json');
const { dataset } = require('../../dataset/dataset');
const { swindlersGoogleService } = require('../services/swindlers-google.service');
const { redisService } = require('../services/redis.service');

const sentMentionsFromStart = [];

const SWINDLER_SETTINGS = {
  DELETE_CHANCE: 0.8,
  LOG_CHANGE: 0.8,
  SAME_CHECK: 0.9,
  APPEND_TO_SHEET: 0.85,
};

const swindlersTopUsed = Object.keys(dataset.swindlers_top_used || {});

if (swindlersTopUsed.length === 0) {
  console.info('WARN: swindlers_top_used are not generated! You need to run `npm run download-swindlers` to generate this file!');
}

class UpdatesHandler {
  /**
   * @param {MtProtoClient} mtProtoClient
   * @param {any} chatPeers - TODO add defined type
   * @param {TensorService} tensorService
   * @param {SwindlersTensorService} swindlersTensorService
   * @param {ProtoUpdate} updateInfo
   * @param {DynamicStorageService} dynamicStorageService
   * @param {SwindlersBotsService} swindlersBotsService
   * @param {UserbotStorage} userbotStorage
   * @param {SwindlersDetectService} swindlersDetectService
   * */
  constructor(
    mtProtoClient,
    chatPeers,
    tensorService,
    swindlersTensorService,
    dynamicStorageService,
    swindlersBotsService,
    userbotStorage,
    swindlersDetectService,
  ) {
    this.mtProtoClient = mtProtoClient;
    this.chatPeers = chatPeers;
    this.tensorService = tensorService;
    this.swindlersTensorService = swindlersTensorService;
    this.dynamicStorageService = dynamicStorageService;
    this.swindlersBotsService = swindlersBotsService;
    this.userbotStorage = userbotStorage;
    this.swindlersDetectService = swindlersDetectService;
  }

  /**
   * @param {ProtoUpdate} updateInfo
   * @param {(string: string) => any} callback
   * */
  filterUpdate(updateInfo, callback) {
    const allowedTypes = ['updateEditChannelMessage', 'updateNewChannelMessage'];

    const newMessageUpdates = updateInfo.updates.filter(
      (anUpdate) =>
        allowedTypes.includes(anUpdate._) &&
        anUpdate.message?.message &&
        anUpdate.message.peer_id?.channel_id !== this.chatPeers.trainingChat.channel_id,
    );
    if (!newMessageUpdates || newMessageUpdates.length === 0) {
      return;
    }

    for (const update of newMessageUpdates) {
      const { message } = update.message;
      callback(message);
    }
  }

  /**
   * @param {string} message
   * */
  async handleSwindlers(message) {
    const finalMessage = message.includes("Looks like swindler's message") ? message.split('\n').slice(3).join('\n') : message;

    /**
     * @type {SwindlerType[]}
     * */
    const matchArray = ['tensor', 'site', 'mention'];

    if (!mentionRegexp.test(finalMessage) && !urlRegexp.test(finalMessage)) {
      return { spam: false, reason: 'doesnt have url' };
    }

    /**
     * @param {number} spamRate
     * @param {SwindlerType} from
     * */
    const processFoundSwindler = async (spamRate, from) => {
      console.info(true, from, spamRate, message);

      const isGoodMatch = matchArray.includes(from);
      const isRateGood = from !== 'tensor' || spamRate > 0.95;

      if (isGoodMatch && isRateGood) {
        const allMentions = this.swindlersBotsService.parseMentions(message);
        const trainingBots = await redisService.getTrainingBots();
        const newMentions = (allMentions || []).filter(
          (item) => ![...this.dynamicStorageService.swindlerBots, ...trainingBots].includes(item),
        );

        if (newMentions.length && newMentions.length < 3) {
          await this.mtProtoClient.sendPeerMessage(newMentions.join('\n'), this.chatPeers.botsChat);
          await redisService.updateTrainingBots(newMentions);
        }
      }

      const { maxChance, isDifferent } = this.userbotStorage.isUniqueText(
        finalMessage,
        this.userbotStorage.swindlerMessages,
        SWINDLER_SETTINGS.SAME_CHECK,
      );
      // console.log({ maxChance, isDifferent, swindlerMessages: this.userbotStorage.swindlerMessages.length });

      if (isDifferent) {
        if (from === 'tensor') {
          this.mtProtoClient.sendSelfMessage([spamRate, message, 'swindlerTensor: true'].join('\n'));
        }

        if (maxChance > SWINDLER_SETTINGS.APPEND_TO_SHEET) {
          swindlersGoogleService.appendTrainingPositives(finalMessage);
        } else {
          this.mtProtoClient.sendPeerMessage(finalMessage, this.chatPeers.swindlersChat);
        }

        this.userbotStorage.swindlerMessages.push(finalMessage);
      }
    };

    const spamResult = await this.swindlersDetectService.isSwindlerMessage(finalMessage);

    if (spamResult.isSpam) {
      await processFoundSwindler(spamResult.rate, spamResult.reason);
      return { spam: true, reason: spamResult.reason, rate: spamResult.rate };
    }

    /**
     * Help try
     * */
    const isHelp = swindlersTopUsed.some((item) => finalMessage.toLowerCase().includes(item));

    if (isHelp) {
      const isUnique = this.userbotStorage.handleHelpMessage(finalMessage);
      if (isUnique) {
        this.mtProtoClient.sendPeerMessage(message, this.chatPeers.helpChat);
        console.info(null, spamResult.results?.foundTensor?.spamRate, message);
        return { spam: false, reason: 'help message' };
      }
    }

    return { spam: false, reason: 'default return' };
  }

  /**
   * @param {string} message
   * */
  async handleTraining(message) {
    let clearMessageText = message;

    const mentions = clearMessageText.match(mentionRegexp);
    const urls = clearMessageText.match(urlRegexp);

    const telegramLinks = [...(mentions || []), ...(urls || [])];

    clearMessageText = clearMessageText.replace(mentionRegexp, ' ');
    clearMessageText = clearMessageText.replace(urlRegexp, ' ');

    deleteFromMessage.forEach((deleteWord) => {
      clearMessageText = clearMessageText.replace(deleteWord, ' ');
    });

    clearMessageText = clearMessageText.replace(/  +/g, ' ').split(' ').slice(0, 15).join(' ');

    const { isSpam, spamRate } = await this.tensorService.predict(clearMessageText, 0.7);
    console.info(isSpam, spamRate, message);

    if (isSpam && spamRate < 0.9) {
      const isNew = this.userbotStorage.handleMessage(clearMessageText);

      if (telegramLinks.length) {
        telegramLinks.forEach((mention) => {
          if (!deleteFromMessage.includes(mention) && !sentMentionsFromStart.includes(mention)) {
            sentMentionsFromStart.push(mention);
            deleteFromMessage.push(mention);

            fs.writeFileSync(path.join(__dirname, './from-entities.json'), JSON.stringify(deleteFromMessage, null, 2));

            this.mtProtoClient.sendSelfMessage(mention);
          }
        });
      }

      if (isNew) {
        this.mtProtoClient.sendPeerMessage(clearMessageText, this.chatPeers.trainingChat).catch(() => console.error('send message error'));
      }
    }
  }
}

module.exports = {
  UpdatesHandler,
};

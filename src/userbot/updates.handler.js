/* eslint-disable no-restricted-syntax,no-await-in-loop,no-unreachable */
const fs = require('fs');
const path = require('path');

const { env } = require('typed-dotenv').config();
const stringSimilarity = require('string-similarity');
const { mentionRegexp, urlRegexp, optimizeText } = require('ukrainian-ml-optimizer');

// eslint-disable-next-line import/no-unresolved
const deleteFromMessage = require('./from-entities.json');
const { dataset } = require('../../dataset/dataset');
const { swindlersRegex } = require('../creator');
const { googleService } = require('../services/google.service');

const sentMentionsFromStart = [];

const SWINDLER_SETTINGS = {
  DELETE_CHANCE: 0.8,
  LOG_CHANGE: 0.8,
  SAME_CHECK: 0.95,
  APPEND_TO_SHEET: 0.85,
};

const swindlersTopUsed = Object.keys(dataset.swindlers_top_used);

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
   * */
  constructor(
    mtProtoClient,
    chatPeers,
    tensorService,
    swindlersTensorService,
    dynamicStorageService,
    swindlersBotsService,
    userbotStorage,
  ) {
    this.mtProtoClient = mtProtoClient;
    this.chatPeers = chatPeers;
    this.tensorService = tensorService;
    this.swindlersTensorService = swindlersTensorService;
    this.dynamicStorageService = dynamicStorageService;
    this.swindlersBotsService = swindlersBotsService;
    this.userbotStorage = userbotStorage;
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

    if (!mentionRegexp.test(finalMessage) && !urlRegexp.test(finalMessage)) {
      return { spam: false, reason: 'doesnt have url' };
    }

    const processFoundSwindler = (spamRate, from) => {
      console.info(true, from, spamRate, message);

      const isGoodMatch = ['tensor', 'site', 'mention'].includes(from);
      const isRateGood = from !== 'tensor' || spamRate > 0.95;

      if (isGoodMatch && isRateGood) {
        const allMentions = this.swindlersBotsService.parseMentions(message);
        const newMentions = (allMentions || []).filter((item) => !this.dynamicStorageService.swindlerBots.includes(item));

        if (newMentions.length) {
          this.mtProtoClient.sendSelfMessage(newMentions.join('\n'));
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
          googleService.appendToSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, finalMessage, 'B6:B');
        } else {
          this.mtProtoClient.sendPeerMessage(finalMessage, this.chatPeers.swindlersChat);
        }

        this.userbotStorage.swindlerMessages.push(finalMessage);
      }
    };

    /**
     * Tensor try
     * The fastest
     * */
    const { isSpam, spamRate } = await this.swindlersTensorService.predict(finalMessage, SWINDLER_SETTINGS.DELETE_CHANCE);

    if (isSpam) {
      processFoundSwindler(spamRate, 'tensor');
      return { spam: true, reason: 'tensor spam', spamRate };
    }

    /**
     * Regex try
     * Fast
     * */
    const isSwindlersSite = swindlersRegex.test(finalMessage.toLowerCase());

    if (isSwindlersSite) {
      processFoundSwindler(200, 'site');
      return { spam: true, reason: 'site match' };
    }

    /**
     * Mention try
     * Medium speed
     * */
    const foundSwindlerMention = this.swindlersBotsService.processMessage(message);

    if (foundSwindlerMention) {
      processFoundSwindler(foundSwindlerMention.rate, 'mention');
      return { spam: true, reason: 'mention match' };
    }

    /**
     * Compare try
     * The slowest
     * */
    let lastChance = 0;
    let maxChance = 0;
    const foundSwindler = dataset.swindlers.some((text) => {
      lastChance = stringSimilarity.compareTwoStrings(optimizeText(finalMessage), text);

      if (lastChance > maxChance) {
        maxChance = lastChance;
      }

      return lastChance >= SWINDLER_SETTINGS.LOG_CHANGE;
    });

    if (foundSwindler) {
      processFoundSwindler(maxChance, 'compare');
      return { spam: true, reason: 'compareTwoStrings match', maxChance };
    }

    /**
     * Help try
     * */
    const isHelp = swindlersTopUsed.some((item) => finalMessage.toLowerCase().includes(item));

    if (isHelp) {
      const isUnique = this.userbotStorage.handleHelpMessage(finalMessage);
      if (isUnique) {
        this.mtProtoClient.sendPeerMessage(message, this.chatPeers.helpChat);
        console.info(null, spamRate, message);
        return { spam: false, reason: 'help message' };
      }
    }

    return { spam: false, reason: 'default return', maxChance };
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

/* eslint-disable no-restricted-syntax,no-await-in-loop,no-unreachable,unicorn/prefer-module */
import fs from 'node:fs';
import path from 'node:path';
import { forEachSeries } from 'p-iteration';
import { mentionRegexp, urlRegexp } from 'ukrainian-ml-optimizer';

import { dataset } from '../../dataset/dataset';
import type { DynamicStorageService } from '../services/dynamic-storage.service';
import { redisService } from '../services/redis.service';
import type { SwindlersBotsService } from '../services/swindlers-bots.service';
import type { SwindlersDetectService } from '../services/swindlers-detect.service';
import { swindlersGoogleService } from '../services/swindlers-google.service';
import type { SwindlersTensorService } from '../tensor/swindlers-tensor.service';
import type { TensorService } from '../tensor/tensor.service';
import type { ProtoUpdate, SwindlerType } from '../types';

// eslint-disable-next-line import/no-unresolved
import deleteFromMessage from './from-entities.json';
import type { MtProtoClient } from './mt-proto-client';
import type { UserbotStorage } from './storage.handler';

const sentMentionsFromStart: any[] = [];

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

export class UpdatesHandler {
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
    private mtProtoClient: MtProtoClient,
    private chatPeers: Record<string, any>,
    private tensorService: TensorService,
    private swindlersTensorService: SwindlersTensorService,
    private dynamicStorageService: DynamicStorageService,
    private swindlersBotsService: SwindlersBotsService,
    private userbotStorage: UserbotStorage,
    private swindlersDetectService: SwindlersDetectService,
  ) {}

  /**
   * @param {ProtoUpdate} updateInfo
   * @param {(string: string) => any} callback
   * */
  filterUpdate(updateInfo: ProtoUpdate, callback: (string: string) => any) {
    const allowedTypes = new Set(['updateEditChannelMessage', 'updateNewChannelMessage']);

    const newMessageUpdates = updateInfo.updates.filter(
      (anUpdate) =>
        allowedTypes.has(anUpdate._) &&
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
  async handleSwindlers(message: string) {
    const finalMessage = message.includes("Looks like swindler's message") ? message.split('\n').slice(3).join('\n') : message;

    const matchArray = new Set<SwindlerType>(['tensor', 'site', 'mention']);

    if (!mentionRegexp.test(finalMessage) && !urlRegexp.test(finalMessage)) {
      return { spam: false, reason: 'doesnt have url' };
    }

    /**
     * @param {number} spamRate
     * @param {SwindlerType} from
     * */
    const processFoundSwindler = async (spamRate: number, from: SwindlerType) => {
      console.info(true, from, spamRate, message);

      const isGoodMatch = matchArray.has(from);
      const isRateGood = from !== 'tensor' || spamRate > 0.95;

      if (isGoodMatch && isRateGood) {
        const allMentions = this.swindlersBotsService.parseMentions(message);
        const trainingBots = await redisService.getTrainingBots();
        const newMentions = (allMentions || []).filter(
          (item) => ![...this.dynamicStorageService.swindlerBots, ...trainingBots].includes(item),
        );

        if (newMentions.length > 0 && newMentions.length < 3) {
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
          await this.mtProtoClient.sendSelfMessage([spamRate, message, 'swindlerTensor: true'].join('\n'));
        }

        // eslint-disable-next-line unicorn/prefer-ternary
        if (maxChance > SWINDLER_SETTINGS.APPEND_TO_SHEET) {
          await swindlersGoogleService.appendTrainingPositives(finalMessage);
        } else {
          await this.mtProtoClient.sendPeerMessage(finalMessage, this.chatPeers.swindlersChat);
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
      const isUnique = await this.userbotStorage.handleHelpMessage(finalMessage);
      if (isUnique) {
        await this.mtProtoClient.sendPeerMessage(message, this.chatPeers.helpChat);
        console.info(null, spamResult.results?.foundTensor?.spamRate, message);
        return { spam: false, reason: 'help message' };
      }
    }

    return { spam: false, reason: 'default return' };
  }

  /**
   * @param {string} message
   * */
  async handleTraining(message: string) {
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
      const isNew = await this.userbotStorage.handleMessage(clearMessageText);

      if (telegramLinks.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        await forEachSeries(telegramLinks, async (mention) => {
          if (!deleteFromMessage.includes(mention) && !sentMentionsFromStart.includes(mention)) {
            sentMentionsFromStart.push(mention);
            deleteFromMessage.push(mention);

            fs.writeFileSync(path.join(__dirname, './from-entities.json'), JSON.stringify(deleteFromMessage, null, 2));

            await this.mtProtoClient.sendSelfMessage(mention);
          }
        });
      }

      if (isNew) {
        this.mtProtoClient.sendPeerMessage(clearMessageText, this.chatPeers.trainingChat).catch(() => console.error('send message error'));
      }
    }
  }
}

import ms from 'ms';
import type { SetNonNullable } from 'type-fest';

import * as redisClient from '@db/redis';

import { initSwindlersContainer } from '@services/swindlers.container';

import { initTensor } from '@tensor/tensor.service';

import { logger } from '@utils/logger';

import { loadUserbotDatasetExtras } from '../../dataset/dataset';

import auth from './auth';
// const { findChannelAdmins } = require('./find-channel-admins');
import type { Peer } from './mt-proto-client';
import { MtProtoClient } from './mt-proto-client';
import { UserbotStorage } from './storage.handler';
import { UpdatesHandler } from './updates.handler';

// const testMessage = ``.trim();

export interface ChatPeers {
  trainingChat: Peer | null;
  helpChat: Peer | null;
  swindlersChat: Peer | null;
  botsChat: Peer | null;
}

logger.info('Start listener application');

auth()
  .then(async (api) => {
    const datasetExtras = await loadUserbotDatasetExtras();

    await redisClient.client.connect().then(() => logger.info('Redis client successfully started'));
    const mtProtoClient = new MtProtoClient(api);

    const { dynamicStorageService, swindlersDetectService, swindlersBotsService, swindlersTensorService } = await initSwindlersContainer();

    const userbotStorage = new UserbotStorage();

    await userbotStorage.init();
    logger.info('Application is listening new messages.');

    const tensorService = await initTensor();

    logger.info('Tensor is ready.');

    // findChannelAdmins(api);
    // return;

    const allChats = await mtProtoClient.messagesGetAllChats();

    const chatPeers: ChatPeers = {
      trainingChat: mtProtoClient.resolvePeer(allChats.chats, 'UA Anti Spam Bot - Test'),
      helpChat: mtProtoClient.resolvePeer(allChats.chats, 'UA Anti Spam Bot - Help'),
      swindlersChat: mtProtoClient.resolvePeer(allChats.chats, 'UA Anti Spam Bot - Swindlers'),
      botsChat: mtProtoClient.resolvePeer(allChats.chats, 'UA Anti Spam Bot - Bots'),
    };

    // eslint-disable-next-line security/detect-object-injection
    const notFoundChatPeer = Object.keys(chatPeers).find((key) => chatPeers[key] === null);

    if (notFoundChatPeer) {
      throw new Error(`Cannot find the following chat peer on this account: ${notFoundChatPeer}`);
    }

    const updatesHandler = new UpdatesHandler(
      mtProtoClient,
      chatPeers as SetNonNullable<ChatPeers, keyof ChatPeers>,
      tensorService,
      swindlersTensorService,
      dynamicStorageService,
      swindlersBotsService,
      userbotStorage,
      swindlersDetectService,
      datasetExtras,
    );

    // const testSwindlerResult = await updatesHandler.handleSwindlers(testMessage);
    // console.log(testSwindlerResult);

    logger.info('Userbot is ready and started.');

    //
    // api.mtproto.updates.on('updatesTooLong', (updateInfo) => {
    //   console.log('updatesTooLong:', updateInfo);
    // });
    //

    api.mtproto.updates.on('updateShortMessage', (updateInfo) => {
      logger.info({ updateInfo }, 'updateShortChatMessage:');
    });

    // api.mtproto.updates.on('updateShortChatMessage', (updateInfo) => {
    //   console.log('updateShortChatMessage:', JSON.stringify(updateInfo));
    // });

    // api.mtproto.updates.on('updateShort', (updateInfo) => {
    //   console.log('updateShort:', updateInfo);
    // });
    //
    // api.mtproto.updates.on('updatesCombined', (updateInfo) => {
    //   console.log('updatesCombined:', updateInfo);
    // });
    //

    // api.mtproto.updates.on('updates', (updateInfo) => {
    //   logger.info('updates:', updateInfo.updates);
    // });
    //
    // api.mtproto.updates.on('updateShortSentMessage', (updateInfo) => {
    //   console.log('updateShortSentMessage:', updateInfo);
    // });˚
    api.mtproto.updates.on('updates', (updateInfo) =>
      updatesHandler.filterUpdate(updateInfo, async (message) => {
        // updatesHandler.handleTraining(message);
        await updatesHandler.handleSwindlers(message);
      }),
    );

    setInterval(async () => {
      try {
        await api.call('updates.getState');
      } catch (error) {
        logger.error(JSON.stringify(error));
      }
    }, ms('15s'));
  })
  .catch((error) => {
    logger.error('Cannot start userbot. Reason:\n', error);
    throw error;
  });

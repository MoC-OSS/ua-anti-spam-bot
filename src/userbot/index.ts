/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import ms from 'ms';
import type { SetNonNullable } from 'type-fest';

import { loadUserbotDatasetExtras } from '../../dataset/dataset';
import { environmentConfig } from '../config';
import { redisClient } from '../db';
import { initSwindlersContainer } from '../services';
import { initTensor } from '../tensor';

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

console.info('Start listener application');
auth()
  .then(async (api) => {
    const datasetExtras = await loadUserbotDatasetExtras();

    await redisClient.client.connect().then(() => console.info('Redis client successfully started'));
    const mtProtoClient = new MtProtoClient(api);

    const { dynamicStorageService, swindlersDetectService, swindlersBotsService, swindlersTensorService } = await initSwindlersContainer();

    const userbotStorage = new UserbotStorage();
    await userbotStorage.init();
    console.info('Application is listening new messages.');

    const tensorService = await initTensor();
    console.info('Tensor is ready.');

    // findChannelAdmins(api);
    // return;

    const allChats = await mtProtoClient.messagesGetAllChats();
    const chatPeers: ChatPeers = {
      trainingChat: mtProtoClient.resolvePeer(allChats.chats, environmentConfig.USERBOT_TRAING_CHAT_NAME),
      helpChat: mtProtoClient.resolvePeer(allChats.chats, 'UA Anti Spam Bot - Help'),
      swindlersChat: mtProtoClient.resolvePeer(allChats.chats, 'UA Anti Spam Bot - Swindlers'),
      botsChat: mtProtoClient.resolvePeer(allChats.chats, 'UA Anti Spam Bot - Bots'),
    };

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

    console.info('Userbot is ready and started.');
    //
    // api.mtproto.updates.on('updatesTooLong', (updateInfo) => {
    //   console.log('updatesTooLong:', updateInfo);
    // });
    //
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    api.mtproto.updates.on('updateShortMessage', (updateInfo) => {
      console.info('updateShortChatMessage:', updateInfo);
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    // api.mtproto.updates.on('updates', (updateInfo) => {
    //   console.info('updates:', updateInfo.updates);
    // });
    //
    // api.mtproto.updates.on('updateShortSentMessage', (updateInfo) => {
    //   console.log('updateShortSentMessage:', updateInfo);
    // });
    api.mtproto.updates.on('updates', (updateInfo) =>
      updatesHandler.filterUpdate(updateInfo, async (message) => {
        // updatesHandler.handleTraining(message);
        await updatesHandler.handleSwindlers(message);
      }),
    );

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setInterval(async () => {
      try {
        await api.call('updates.getState');
      } catch (error) {
        console.error(JSON.stringify(error));
      }
    }, ms('15s'));
  })
  .catch((error) => {
    console.error('Cannot start userbot. Reason:\n', error);
    throw error;
  });

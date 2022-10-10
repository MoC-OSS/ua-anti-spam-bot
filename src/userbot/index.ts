/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { environmentConfig } from '../config';
import { redisClient } from '../db';
import { initSwindlersContainer } from '../services/swindlers.container';
import { initTensor } from '../tensor/tensor.service';

import auth from './auth';
// const { findChannelAdmins } = require('./find-channel-admins');
import { MtProtoClient } from './mt-proto-client';
import { UserbotStorage } from './storage.handler';
import { UpdatesHandler } from './updates.handler';

// const testMessage = ``.trim();

console.info('Start listener application');
auth()
  .then(async (api) => {
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
    const chatPeers = {
      trainingChat: mtProtoClient.resolvePeer(allChats.chats, environmentConfig.USERBOT_TRAING_CHAT_NAME),
      helpChat: mtProtoClient.resolvePeer(allChats.chats, 'UA Anti Spam Bot - Help'),
      swindlersChat: mtProtoClient.resolvePeer(allChats.chats, 'UA Anti Spam Bot - Swindlers'),
      botsChat: mtProtoClient.resolvePeer(allChats.chats, 'UA Anti Spam Bot - Bots'),
    };

    const updatesHandler = new UpdatesHandler(
      mtProtoClient,
      chatPeers,
      tensorService,
      swindlersTensorService,
      dynamicStorageService,
      swindlersBotsService,
      userbotStorage,
      swindlersDetectService,
    );

    // const testSwindlerResult = await updatesHandler.handleSwindlers(testMessage);
    // console.log(testSwindlerResult);

    // console.info('Userbot is ready and started and fixed');
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
    api.mtproto.updates.on('updates', (updateInfo) => {
      console.info('updates:', updateInfo.updates);
    });
    //
    // api.mtproto.updates.on('updateShortSentMessage', (updateInfo) => {
    //   console.log('updateShortSentMessage:', updateInfo);
    // });
    // api.mtproto.updates.on('updates', (updateInfo) =>
    //   updatesHandler.filterUpdate(updateInfo, async (message) => {
    //     // updatesHandler.handleTraining(message);
    //     await updatesHandler.handleSwindlers(message);
    //   }),
    // );

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    setInterval(async () => {
      try {
        await api.call('updates.getState');
      } catch (error) {
        console.error(JSON.stringify(error));
      }
    }, 15_000);
  })
  .catch((error) => {
    console.error('Cannot auth. Reason', error);
  });

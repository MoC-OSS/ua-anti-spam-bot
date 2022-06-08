const { env } = require('typed-dotenv').config();

const { redisClient } = require('../db');
const auth = require('./auth');
const { UserbotStorage } = require('./storage.handler');
const { updatesHandler } = require('./updates.handler');
const { initTensor } = require('../tensor/tensor.service');
const { initSwindlersTensor } = require('../tensor/swindlers-tensor.service');
// const { findChannelAdmins } = require('./find-channel-admins');
const { MtProtoClient } = require('./mt-proto-client');
// const { googleService } = require('../services/google.service');

console.info('Start listener application');
auth().then(async (api) => {
  await redisClient.client.connect().then(() => console.info('Redis client successfully started'));
  const mtProtoClient = new MtProtoClient(api);
  const userbotStorage = new UserbotStorage();
  await userbotStorage.init();
  console.info('Application is listening new messages.');

  const tensorService = await initTensor();
  const swindlersTensorService = await initSwindlersTensor();
  console.info('Tensor is ready.');

  // findChannelAdmins(api);
  // return;

  const allChats = await mtProtoClient.messagesGetAllChats();
  const chatPeers = {
    trainingChat: mtProtoClient.resolvePeer(allChats.chats, env.USERBOT_TRAING_CHAT_NAME),
    helpChat: mtProtoClient.resolvePeer(allChats.chats, 'UA Anti Spam Bot - Help'),
    swindlersChat: mtProtoClient.resolvePeer(allChats.chats, 'UA Anti Spam Bot - Swindlers'),
  };

  // googleService.appendToSheet(env.GOOGLE_SPREADSHEET_ID, env.GOOGLE_SWINDLERS_SHEET_NAME, 'test_google', 'B6:B');
  // userbotStorage.swindlerMessages.push('test_');
  // mtProtoClient.sendPeerMessage('test_message', chatPeers.swindlersChat);
  //
  // console.log(chatPeers.swindlersChat);

  api.mtproto.updates.on('updates', (updateInfo) =>
    updatesHandler(mtProtoClient, chatPeers, tensorService, swindlersTensorService, updateInfo, userbotStorage),
  );

  setInterval(async () => {
    try {
      await api.call('updates.getState');
    } catch (error) {
      console.error(JSON.stringify(error));
    }
  }, 15000);
});

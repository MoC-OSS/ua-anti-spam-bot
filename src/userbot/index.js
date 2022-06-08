const { env } = require('typed-dotenv').config();

const { redisClient } = require('../db');
const auth = require('./auth');
const { UserbotStorage } = require('./storage.handler');
const { UpdatesHandler } = require('./updates.handler');
const { initTensor } = require('../tensor/tensor.service');
const { initSwindlersTensor } = require('../tensor/swindlers-tensor.service');
// const { findChannelAdmins } = require('./find-channel-admins');
const { MtProtoClient } = require('./mt-proto-client');
// const { googleService } = require('../services/google.service');

// const testMessage = ``.trim();

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

  const updatesHandler = new UpdatesHandler(mtProtoClient, chatPeers, tensorService, swindlersTensorService, userbotStorage);

  // const testSwindlerResult = await updatesHandler.handleSwindlers(testMessage);
  // console.log(testSwindlerResult);

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
      console.error(JSON.stringify(error));
    }
  }, 15000);
});

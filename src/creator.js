const { env } = require('typed-dotenv').config();

// TODO remove this file later and from Git-history
const creatorId = env.CREATOR_ID ?? 341977297;
const creatorNick = '@dimkasmile';
const logsChat = -1001599612617;
const trainingChat = env.TRAINING_CHAT_ID ?? -1001527463076;
const privateTrainingChat = -788538459;

module.exports = {
  logsChat,
  trainingChat,
  privateTrainingChat,
  creatorNick,
  creatorId,
};

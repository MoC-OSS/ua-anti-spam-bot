const { env } = require('typed-dotenv').config();

// TODO remove this file later and from Git-history
const creatorId = env.CREATOR_ID ?? 341977297;
const creatorNick = '@dimkasmile';
const logsChat = -1001599612617;
const trainingChat = -1001527463076;

module.exports = {
  logsChat,
  trainingChat,
  creatorNick,
  creatorId,
};

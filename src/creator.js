const { env } = require('typed-dotenv').config();

// TODO remove this file later and from Git-history
const creatorId = env.CREATOR_ID ?? 341977297;
const helpChat = 'https://t.me/+HqGGPsRDMwk4NjQy';
const logsChat = -1001599612617;
const trainingChat = env.TRAINING_CHAT_ID ?? -1001527463076;
const privateTrainingChat = -788538459;

const swindlersRegex =
  /(?:https?:\/\/)?(privat24.|privatpay|privatbank.my-payment|app-raiffeisen|mono-bank|login24|privat\.|privat24.ua-|privatbank.u-|privatbank.m|privatbank.a|e-pidtrimka|perekazprivat|privatbank.|privatapp|da-pay|goo.su|p24.|8-pay|pay-raiffeisen|myprlvat|orpay|privat24-.|monobank.|tpays|mopays|leaf-pays|j-pay|i-pay|olx-ua|op-pay|ok-pay|uabuy|private24|darpayments|o-pay|u.to|privatgetmoney|inlnk.ru|privat-|-pay|ik-safe|transfer-go|24pay.|-pau.me|-pai.me|u-pau.com|uasafe|ua-talon|menlo.pw|prlvatbank)(?!ua).+/;

module.exports = {
  logsChat,
  trainingChat,
  privateTrainingChat,
  creatorId,
  swindlersRegex,
  helpChat,
};

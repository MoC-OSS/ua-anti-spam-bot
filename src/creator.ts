import { environmentConfig } from './config';

// TODO remove this file later and from Git-history
export const creatorId = environmentConfig.CREATOR_ID ?? 341_977_297;
export const helpChat = 'https://t.me/+HqGGPsRDMwk4NjQy';
export const logsChat = -1_001_599_612_617;
export const trainingChat = -1_001_527_463_076;
export const privateTrainingChat = -788_538_459;

export const swindlerMessageChatId = -1_001_769_124_427;
export const swindlerBotsChatId = -672_793_621;
export const swindlerHelpChatId = -1_001_750_209_242;

export const swindlersRegex =
  /(?:https?:\/\/)?(privat24.|privatpay|privatbank.my-payment|app-raiffeisen|mono-bank|login24|privat\.|privat24.ua-|privatbank.u-|privatbank.m|privatbank.a|e-pidtrimka|perekazprivat|privatbank.|privatapp|da-pay|goo.su|p24.|8-pay|pay-raiffeisen|myprlvat|orpay|privat24-.|monobank.|tpays|mopays|leaf-pays|j-pay|i-pay|olx-ua|op-pay|ok-pay|uabuy|private24|darpayments|o-pay|u.to|privatgetmoney|inlnk.ru|privat-|-pay|ik-safe|transfer-go|24pay.|-pau.me|-pai.me|u-pau.com|uasafe|ua-talon|menlo.pw|prlvatbank)(?!ua).+/;

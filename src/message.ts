import moment from 'moment-timezone';

import type { CustomJsonObject } from './types/object';
import { environmentConfig } from './config';
import { helpChat } from './creator';
import type { ChatSessionData, FeaturesSessionsData } from './types';
import { formatStateIntoAccusative, getRandomItem } from './utils';

export * from './message/index';

export const randomBanEmojis = ['👮🏻‍♀️', '🤦🏼‍♀️', '🙅🏻‍♀️'];

export const randomLocationBanEmojis = ['🏡', '🏘️', '🌳'];

function getCurrentTimeAndDate() {
  return moment().format('LT');
}

export interface GenericBotProperties {
  botName: string;
}

/**
 * Generic
 * */
export const getAdminReadyMessage = ({ botName }: GenericBotProperties) =>
  `
😎 <b>Тепер я адміністратор.</b> Готовий до роботи.
⚙️ Всі налаштування бота доступні за командою <b>/settings@${botName}</b>

👩‍💻 Якщо бот не працює чи є питання і пропозиції, пишіть в <a href="${helpChat}">чат підтримки</a>.
`.trim();

export const adminReadyHasNoDeletePermissionMessage = '😢 Тепер я адміністратор. Але не маю права на видалення повідомлень.';

export const startAdminReadyMessage = '✅ Я активований і виконую свою роботу.';

export const memberReadyMessage = '😴 Тепер я деактивований. Відпочиваю... ';

export const makeAdminMessage = `⛔️ Я не активований!
<b>☝️Зроби мене адміністратором, щоб я міг видаляти повідомлення, а також все інше що я вмію, за твоїм бажанням.</b>`;

export const hasDeletePermissionMessage = '✅ Я маю права на видалення повідомлень.';

export const hasNoDeletePermissionMessage = '⛔ Я не маю права на видалення повідомлень.';

export const featureNoAdminMessage = '⛔️ Я не активований!\n<b>☝️Зроби мене адміністратором, щоб я міг дати цей функціонал.</b>';

/**
 * Generic - Air alarm
 * */
export const chatIsMutedMessage = `
🤫 Можливість відправляти повідомлення під час повітряної тривоги тимчасово заблокована!
`;

export const chatIsUnmutedMessage = `
💬 Блокування повідомлень зняті. Приємного спілкування!
`;

export const isNight = () => {
  const hours = +moment().format('H');

  return hours >= 20 || hours <= 5;
};

export const getDayTimeEmoji = () => (isNight() ? '🌖' : '☀️');

export const getRandomAlarmStartText = () => {
  const currentTimeEmoji = getDayTimeEmoji();
  const randomAlarmEmoji = getRandomItem(['⚠️', '❗️', '🔊', '🚨', '📢', '❕', currentTimeEmoji]);

  const genericMessages = [
    '<b>НЕ нехтуйте</b> повітряною тривогою.',
    'Покиньте вулиці та пройдіть в укриття!',
    'Пройдіть до укриття!',
    'Будьте обережні!',
    'Будьте в укриттях.',
    'Не ігноруйте сигнали повітряної тривоги!',
    'Не ігноруйте тривогу!',
    'Перебувайте в укриттях до завершення повітряної тривоги!',
  ];

  return `${getRandomItem(genericMessages)} ${randomAlarmEmoji}`;
};

export const getRandomAlarmEndText = () => {
  const currentTimeEmoji = getDayTimeEmoji();
  const randomAlarmEmoji = `${getRandomItem(['🇺🇦', '🙏', currentTimeEmoji])} `;

  const genericMessages = [
    'Будьте обережні',
    'Бережіть себе',
    'Дякуємо силам ППО!',
    'Слава ЗСУ!',
    'Усім мирного неба над головою',
    'Дякуємо ППО за роботу!',
  ].map((item) => `${item} ${randomAlarmEmoji}`);

  const nightMessages = [`Всім тихої ночі! ${currentTimeEmoji}`, `Всім гарного вечора і тихої ночі! ${currentTimeEmoji}`];
  const dayMessages = ['Всім гарного дня! ☀️'];

  return isNight() ? getRandomItem([...genericMessages, ...nightMessages]) : getRandomItem([...genericMessages, ...dayMessages]);
};

/**
 * @param {ChatSessionData['chatSettings']} settings
 * @param isRepeatedAlarm
 * */
export const getAlarmStartNotificationMessage = (settings: ChatSessionData['chatSettings'], isRepeatedAlarm = false) => `
🔴 <b> ${getCurrentTimeAndDate()} ${isRepeatedAlarm ? 'Повторна повітряна' : 'Повітряна'} тривога в ${formatStateIntoAccusative(
  settings.airRaidAlertSettings.state || '',
)}!</b>
${getRandomAlarmStartText()}
`;

/**
 * @param {ChatSessionData['chatSettings']} settings
 * */
export const alarmEndNotificationMessage = (settings: ChatSessionData['chatSettings']) => `
🟢 <b>${getCurrentTimeAndDate()} Відбій тривоги в ${formatStateIntoAccusative(settings.airRaidAlertSettings.state || '')}!</b>
${getRandomAlarmEndText()}
`;

export const cancelMessageSending = 'Розсилка була відмінена!';
/**
 * Complex - Settings
 * */

export const getAirRaidAlarmSettingsMessage = (settings: ChatSessionData['chatSettings']) =>
  `
<b>🤖 Налаштування повітряної тривоги в поточному чаті.</b>
Тут ти можеш змінити регіон до якого відноситься цей чат.

🏰 ${
    settings.airRaidAlertSettings.state
      ? `✅ ${settings.airRaidAlertSettings.state} - твій вибраний регіон.`
      : '⛔️ Ти ще не вибрав свій регіон.'
  }

Для зміни налаштувань, натисніть на відповідну кнопку нижче. 👇
`.trim();

export const nextPage = 'Наступна сторінка ⏩';

export const previousPage = '⏪ Попередня сторінка';

/**
 *
 * Message that bots sends before confirmation
 *
 * */
export const confirmationMessage = `
 Ось що буде надіслано до чатів:
 `.trim();

/**
 * Complex
 * */
export const startMessageAtom = `
Привіт! 🇺🇦✌️
<b>UA Anti Spam Bot 🇺🇦</b> — це безоплатний інструмент, який полегшує адміністрування Telegram-каналів і груп під час повномасштабної війни.

<b>Можливості UA Anti Spam Bot, які ввімкнені за замовчуванням:</b>
- 🚀 Боремося зі шкідливими коментарями, що загрожують здоров’ю наших громадян і військовослужбовців: переміщення ЗСУ, локації “прильотів”, блокпости та інше.
- 💰 Захист від фішингу та шахраїв. Блокуємо шахрайські коментарі, збори, несправжню допомогу від організацій.
- 🔞 Без порнографії. Блокуємо коментарі з відвертим характером та дорослим контентом (18+).
- ✋ Автоматичне видалення повідомлень приєднання та прощання, щоб зберегти конфіденційність ваших ділових обговорень.

<b>Можливості UA Anti Spam Bot, які можна опціонально налаштувати:</b>
- 📢 Сповіщення в чаті про початок і відбій повітряної тривоги у вашому регіоні.
- 🤫 Вимикання чату під час повітряної тривоги.
- 💳 Блокування коментарів зі зборами грошей на банківські картки.
- ↩️ Блокування пересланих повідомлень чи коментарів зі згадуваннями @.
- 🔗 Блокування коментарів, якщо в них є будь-які посилання.
- 💬 Блокування коментарів, якщо вони надіслані від імені телеграм каналу.
- 📍 Не розголошуємо локації. Блокуємо коментарі з будь-якими локаціями.
- ☢️ Попередження про використання російської мови як мови окупанта в коментарі користувача разом із мотивацією перейти на українську.
- 🪆 Блокування коментарів, написаних російською мовою як мовою окупанта, разом із мотивацією переходити на українську мову.
`.trim();

/**
 *
 * Message that bots sends if user has no rights to perform mass sending
 *
 * */
export const getDeclinedMassSendingMessage = 'Вибач, але у тебе немає прав для цієї команди.😞'.trim();

export interface DeleteMessageAtomProperties {
  writeUsername: string;
  userId?: number;
}

export const getDeleteUserAtomMessage = ({ writeUsername, userId }: DeleteMessageAtomProperties) =>
  `
❗️ ${userId && writeUsername ? `<a href="tg://user?id=${userId}">${writeUsername}</a>, <b>повідомлення` : '<b>Повідомлення'} видалено</b>.
`.trim();

export interface DeleteMessageProperties extends DeleteMessageAtomProperties {
  wordMessage: string;
  debugMessage: string;
  withLocation?: boolean;
}

/**
 *
 * Message that bot sends on delete
 *
 * */
export const getDeleteMessage = ({ writeUsername, userId, wordMessage, debugMessage, withLocation }: DeleteMessageProperties) =>
  `
${getDeleteUserAtomMessage({ writeUsername, userId })}

${getRandomItem(withLocation ? randomLocationBanEmojis : randomBanEmojis)} <b>Причина</b>: поширення потенційно стратегічної інформації${
    withLocation ? ' з повідомленням локації' : ''
  }${wordMessage}.

✊🏻 «<b>єВорог</b>» — новий бот від Мінцифри, яким не зможуть скористатися окупанти.
Повідомляйте цю інформацію йому.

👉🏻 @evorog_bot



${debugMessage}`.trim();

export interface DeleteFeatureMessageProperties extends DeleteMessageAtomProperties {
  featuresString: string;
}

export const getDeleteFeatureMessage = ({ writeUsername, userId, featuresString }: DeleteFeatureMessageProperties) => `
${getDeleteUserAtomMessage({ writeUsername, userId })}

🤫 Відправка повідомлень з <b>${featuresString}</b> недоступна по правилам цього чату.
`;

export const getDeleteNsfwMessage = ({ writeUsername, userId }: DeleteMessageAtomProperties) =>
  `
${getDeleteUserAtomMessage({ writeUsername, userId })}

🔞 Зображення або текст з <b>відвертим характером</b> та <b>дорослим контентом (18+)</b> заборонені.
`.trim();

export const getDeleteCounteroffensiveMessage = ({ writeUsername, userId }: DeleteMessageAtomProperties) => `
${getDeleteUserAtomMessage({ writeUsername, userId })}

🤫 Міноборони рекомендує не обговорювати контрнаступ ЗСУ. Тому, будь ласка, уникайте коментарів на цю тему!
`;

export interface DebugMessageProperties {
  message: string | undefined;
  byRules: CustomJsonObject;
  startTime: Date;
}

/**
 *
 * Returns debug message that bot adds to delete message if environmentConfig is debug
 *
 * */
export const getDebugMessage = ({ message, byRules, startTime }: DebugMessageProperties) =>
  `
***DEBUG***
Message:
${message || 'Message is undefined'}

Ban reason:
${JSON.stringify(byRules)}

Logic type:
${environmentConfig.USE_SERVER ? 'server' : 'local'}

Last deploy:
${startTime.toString()}
`.trim();

export interface ChatStatisticsMessageProperties {
  adminsChatsCount: number;
  botRemovedCount: number;
  channelCount: number;
  groupCount: number;
  memberChatsCount: number;
  privateCount: number;
  superGroupsCount: number;
  totalSessionCount: number;
  totalUserCounts: number;
}

export interface FeaturesStatisticsMessageProperties {
  features: FeaturesSessionsData;
  chatsCount: number;
}

/**
 *
 * Message that bot sends on /statistics
 *
 * */
export const getChatStatisticsMessage = ({
  adminsChatsCount,
  botRemovedCount,
  channelCount,
  groupCount,
  memberChatsCount,
  privateCount,
  superGroupsCount,
  totalSessionCount,
  totalUserCounts,
}: ChatStatisticsMessageProperties) =>
  `
<b>Кількість всіх: </b>
• Чатів - ${totalSessionCount} 🎉
• Користувачів - ${totalUserCounts} 🎉

<b>Статистика по групам</b>

👨‍👩‍👧‍👦 Супер-груп чатів: <b>${superGroupsCount}</b>
👩‍👦 Груп чатів: <b>${groupCount}</b>

✅ Активний адмін: в <b>${adminsChatsCount}</b> групах
⛔️ Вимкнений адмін: в <b>${memberChatsCount}</b> групах

😢 Бота видалили: із <b>${botRemovedCount}</b> груп

<b>Інша статистика</b>

💁‍♂️ Приватних чатів: <b>${privateCount}</b>
🔔 Каналів: <b>${channelCount}</b>


`.trim();

function getPercentage(digits: number) {
  return (digits * 100).toFixed(2);
}

/**
 *
 * Message that bot sends on /statistics
 *
 * */
export const getFeaturesStatisticsMessage = ({ features, chatsCount }: FeaturesStatisticsMessageProperties) =>
  `
<b>Статистика по фічам з ${chatsCount} чатів</b>

<b>🔴 Виключений дефолтний функціонал:</b>
🚀 Бот видаляє стратегічну інформацію: <b>${features.disableStrategicInfo} (${getPercentage(
    features.disableStrategicInfo / chatsCount,
  )}%)</b>
❗ Бот повідомляє про причину видалення повідомлення: <b>${features.disableDeleteMessage} (${getPercentage(
    features.disableDeleteMessage / chatsCount,
  )}%)</b>
💰 Бот видаляє повідомлення шахраїв: <b>${features.disableSwindlerMessage} (${getPercentage(
    features.disableSwindlerMessage / chatsCount,
  )}%)</b>
✋ Бот видаляє повідомлення приєдання та прощання: <b>${features.disableDeleteServiceMessage} (${getPercentage(
    features.disableDeleteServiceMessage / chatsCount,
  )}%)</b>
🔞 Бот видаляє зображення відвертого змісту та дорослий контент: <b>${features.disableNsfwFilter} (${getPercentage(
    features.disableNsfwFilter / chatsCount,
  )}%)</b>
🚫 Бот видаляє повідомлення антисемітського змісту: <b>${features.disableDeleteAntisemitism} (${getPercentage(
    features.disableDeleteAntisemitism / chatsCount,
  )}%)</b>

<b>🟢 Включений опціональний функціонал:</b>
🤫 Бот вимикає чат під час повітряної тривоги: <b>${features.disableChatWhileAirRaidAlert} (${getPercentage(
    features.disableChatWhileAirRaidAlert / chatsCount,
  )}%)</b>
💳 Бот видаляє повідомлення з картками: <b>${features.enableDeleteCards} (${getPercentage(features.enableDeleteCards / chatsCount)}%)</b>
🔗 Бот видаляє повідомлення з посиланнями: <b>${features.enableDeleteUrls} (${getPercentage(features.enableDeleteUrls / chatsCount)}%)</b>
📍 Бот видаляє повідомлення з локаціями: <b>${features.enableDeleteLocations} (${getPercentage(
    features.enableDeleteLocations / chatsCount,
  )}%)</b>
⚓ Бот видаляє повідомлення зі @ згадуваннями: <b>${features.enableDeleteMentions} (${getPercentage(
    features.enableDeleteMentions / chatsCount,
  )}%)</b>
↩️ Бот видаляє повідомлення з пересиланнями: <b>${features.enableDeleteForwards} (${getPercentage(
    features.enableDeleteForwards / chatsCount,
  )}%)</b>
💬 Бот видаляє повідомлення від інших телеграм каналів: <b>${features.enableDeleteChannelMessages} (${getPercentage(
    features.enableDeleteForwards / chatsCount,
  )}%)</b>
🏃 Бот видаляє повідомлення з контрнаступом: <b>${features.enableDeleteCounteroffensive} (${getPercentage(
    features.enableDeleteCounteroffensive / chatsCount,
  )}%)</b>
🪆 Бот видаляє повідомлення з російською мовою: <b>${features.enableDeleteRussian} (${getPercentage(
    features.enableDeleteRussian / chatsCount,
  )}%)</b>
☢ Бот попереджає про заборону російської мови: <b>${features.enableWarnRussian} (${getPercentage(
    features.enableWarnRussian / chatsCount,
  )}%)</b>
📢 Бот повідомляє про початок і завершення повітряної тривоги: <b>${features.notificationMessage} (${getPercentage(
    features.notificationMessage / chatsCount,
  )}%)</b>
🤬 Бот видаляє повідомлення з нецензурною лексикою: <b>${features.enableDeleteObscene} (${getPercentage(
    features.enableDeleteObscene / chatsCount,
  )}%)</b>
⚠ Бот попереджає про заборону нецензурної лексики: <b>${features.enableWarnObscene} (${getPercentage(
    features.enableWarnObscene / chatsCount,
  )}%)</b>



`.trim();

export interface HelpMessageProperties {
  startLocaleTime: string;
  isAdmin?: boolean;
  canDelete: boolean;
  user: string;
  userId: number;
}

/**
 *
 * Message that bot sends on /get_new_statistic where no new data
 *
 * */
export const noNewStatisticMessage = 'Немає нових записів.';

/**
 *
 * Help handler
 *
 * */
export const getHelpMessage = ({ startLocaleTime, isAdmin, canDelete, user, userId }: HelpMessageProperties) =>
  `
<a href="tg://user?id=${userId}">${user}</a>

${isAdmin ? startAdminReadyMessage : makeAdminMessage}
${canDelete ? hasDeletePermissionMessage : hasNoDeletePermissionMessage}

<b>Якщо повідомлення було видалено помилково:</b>

• Попросіть адміністраторів написати його самостійно;
• Пришліть його скріншотом.

<b>Останнє оновлення боту:</b>

${startLocaleTime},

Якщо є запитання, пишіть в <a href="${helpChat}">чат підтримки</a>.

<b>Гаряча лінія допомоги:</b>

Якщо ви стали жертвою шахраїв або ваш акаунт зламали, звертайтесь на безоплатну гарячу лінію з цифрової безпеки.

Отримати фахову консультацію:
👉 @nadiyno_bot

Детальніше за командою /hotline_security
`.trim();

/**
 *
 * Message that bot will send when user uses /start in private
 *
 * */
export const getStartMessage = () =>
  `
${startMessageAtom}

<b>Щоб бот запрацював у чаті:</b>

1) Додайте бот в чат
2) Зробіть бота адміністратором.

Розробник бота — @dimkasmile за підтримки IT-компанії Master of Code Global.
Якщо бот не працює, пишіть в <a href="${helpChat}">чат підтримки</a>.

Дивись відео з інструкцією нижче:
https://youtu.be/RX0cZYf1Lm4
`.trim();

export interface GroupStartMessageProperties {
  adminsString?: string;
  isAdmin?: boolean;
  canDelete: boolean;
  user?: string;
  userId?: number;
}

/**
 *
 * Message that bot sends when user uses /start in the group
 *
 * */
export const getGroupStartMessage = ({ adminsString, isAdmin = false, canDelete, user = '', userId }: GroupStartMessageProperties) =>
  `
${userId ? `<a href="tg://user?id=${userId}">${user}</a>` : user}

${isAdmin ? startAdminReadyMessage : makeAdminMessage}
${canDelete ? hasDeletePermissionMessage : hasNoDeletePermissionMessage}

${((!isAdmin || !canDelete) && (adminsString ? `З цим може допомогти: ${adminsString}` : 'З цим може допомогти творець чату')) || ''}
`.trim();

export interface CannotDeleteMessageProperties {
  adminsString?: string;
}

export const getCannotDeleteMessage = ({ adminsString }: CannotDeleteMessageProperties) =>
  `
<b>😢 Не можу видалити це повідомлення.</b>
Я не маю прав на видалення або в Telegram стався збій.

🧐 Перевірте права чи зробіть мене адміністратором знову.
${adminsString ? `З цим може допомогти: ${adminsString}` : 'З цим може допомогти творець чату'}
`.trim();

/**
 *
 * Message that bot sends when user invites it into a channel
 *
 * */
export const getStartChannelMessage = ({ botName }: GenericBotProperties) =>
  `
Привіт! Повідомлення від офіційного чат-боту @${botName}.
Ви мене додали в <b>канал</b> як адміністратора, але я не можу перевіряти повідомлення в коментарях.

Видаліть мене і додайте в <b>чат каналу</b> каналу <b>як адміністратора</b>.
Якщо є запитання, пишіть в <a href="${helpChat}">чат підтримки</a>
`.trim();

/**
 *
 * Message when bot asks user what does he want to send to all private chats
 *
 * */
export const getUpdatesMessage = () =>
  `
Напиши після цього повідомлення те, що ти хочеш відправити по всім активним сесіям:

`.trim();

export interface UpdateMessageProperties {
  totalCount: number;
  finishedCount: number;
  successCount: number;
  type: string; // TODO add type
}

export const getUpdateMessage = ({ totalCount, finishedCount, successCount, type }: UpdateMessageProperties) =>
  `
Було опрацьовано ${finishedCount}/${totalCount} повідомлень для ${type}...
Успішно ${successCount} повідомлень.
`.trim();

export interface SuccessfulMessageProperties {
  totalCount: number;
  successCount: number;
}

/**
 *
 * Message that bots sends before confirmation
 *
 * */
export const getSuccessfulMessage = ({ totalCount, successCount }: SuccessfulMessageProperties) =>
  `
Розсилка завершена!
Було відправлено ${successCount}/${totalCount} повідомлень.
`.trim();

export interface BotJoinMessageProperties {
  adminsString?: string;
  isAdmin?: boolean;
  canDelete: boolean;
}

/**
 *
 * Message that bot sends when user invites in into a group
 *
 * */
export const getBotJoinMessage = ({ adminsString, isAdmin = false, canDelete }: BotJoinMessageProperties) =>
  `
${startMessageAtom}

${getGroupStartMessage({ adminsString, isAdmin, canDelete, user: undefined, userId: undefined }).trim()}
`.trim();

export interface TensorTestResultProperties {
  chance: string;
  isSpam: boolean;
}

/**
 * Test messages
 */
export const getTensorTestResult = ({ chance, isSpam }: TensorTestResultProperties) =>
  `
🎲 Шанс спаму - <b>${chance}</b>
🤔 Я вважаю...<b>${isSpam ? '✅ Це спам' : '⛔️ Це не спам'}</b>
`.trim();

/**
 * Russian warn/delete messages
 * */

export interface DeleteRussianMessageProperties extends DeleteMessageAtomProperties {
  message: string;
}

export const getWarnRussianMessage = (message: string) => `🫶🇺🇦 ${message}`;

export const getDeleteRussianMessage = ({ writeUsername, userId, message }: DeleteRussianMessageProperties) => `
${getDeleteUserAtomMessage({ writeUsername, userId })}

${getWarnRussianMessage(message)}
`;

export const getUkrainianMessageExtra = (percent: number) => (percent === 200 ? '\nВ українській мові немає букв ъ, ы, э, та ё 🇺🇦' : '');

/**
 * Logs
 * */
export const swindlerLogsStartMessage = "Looks like swindler's message";

export const russianDeleteLogsStartMessage = 'Deleted russian message';

export const russianWarnLogsStartMessage = 'Warn russian message';

export const nsfwLogsStartMessage = 'Looks like nsfw';

export const cannotDeleteMessage = 'Cannot delete the following message from chat';

export const urlLogsStartMessage = 'Deleted URLs message';

export const locationLogsStartMessage = 'Deleted location message';

export const mentionLogsStartMessage = 'Deleted mention message';

export const cardLogsStartMessage = 'Deleted card message';

export const counteroffensiveLogsStartMessage = 'Deleted counteroffensive message by';

export const obsceneDeleteLogsStartMessage = 'Delete obscene message';

export const obsceneWarnLogsStartMessage = 'Warn obscene message';

export const antisemitismDeleteLogsStartMessage = 'Delete antisemitism message';

export const channelMessageLogsStartMessage = 'Deleted message from channel';

export const logsStartMessages = new Set([
  swindlerLogsStartMessage,
  russianDeleteLogsStartMessage,
  russianWarnLogsStartMessage,
  nsfwLogsStartMessage,
  cannotDeleteMessage,
  urlLogsStartMessage,
  locationLogsStartMessage,
  mentionLogsStartMessage,
  cardLogsStartMessage,
  counteroffensiveLogsStartMessage,
  obsceneDeleteLogsStartMessage,
  obsceneWarnLogsStartMessage,
  antisemitismDeleteLogsStartMessage,
  channelMessageLogsStartMessage,
]);

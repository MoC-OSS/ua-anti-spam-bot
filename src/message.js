const { env } = require('typed-dotenv').config();

const { creatorNick } = require('./creator');

/**
 * Generic
 * */
const adminReadyMessage = 'Тепер я адміністратор. Готовий до роботи 😎';
const startAdminReadyMessage = '✅ Я активований і виконую свою роботу';
const memberReadyMessage = 'Тепер я деактивований. Відпочиваю... 😴';
const spamDeleteMessage = '❗️ Повідомлення видалено.\n\n* Причина: спам.';
const somethingWentWrongMessage = 'Сталась якась помилка :(';
const makeAdminMessage = '⛔️ Я не активований.\n<b>☝️Зроби мене адміністратором, щоб я міг видаляти повідомлення.</b>';

/**
 * Generic - Settings
 * */
const settingsDeleteItemMessage = 'Повідомлення про видалення';
const settingsSubmitMessage = '💾 Зберегти';
const cancelMessageSending = 'Розсилка була відмінена!';
/**
 * Complex - Settings
 * */

const getSettingsMenuMessage = ({ disableDeleteMessage }) =>
  `
🤖 Налаштування бота.
Тут ви можете регулювати параметри.

${disableDeleteMessage === false ? '⛔️ Бот не повідомляє про видалені повідомлення' : '✅ Бот повідомляє про видалені повідомлення'}
`.trim();

/**
 * Complex
 * */
const startMessageAtom = `
Привіт! 🇺🇦✌️

Я чат-бот, який дозволяє автоматично видаляти повідомлення, що містять назви локацій міста, укриттів, а також ключові слова переміщення військ.
`.trim();

/**
 *
 * Message that bots sends if user has no rights to perform mass sending
 *
 * */
const getDeclinedMassSendingMessage = 'Вибач, але у тебе немає прав робити масову розсилку.'.trim();

/**
 *
 * Message that bot sends on delete
 *
 * */
const getDeleteMessage = ({ writeUsername, wordMessage, debugMessage }) =>
  `
❗️ ${writeUsername} Повідомлення видалено.

* Причина: поширення потенційно стратегічної інформації${wordMessage}.

✊🏻 «єВорог» — новий бот від Мінцифри, яким не зможуть скористатися окупанти.
Повідомляйте цю інформацію йому.

👉🏻 @evorog_bot



${debugMessage}`.trim();

/**
 *
 * Returns debug message that bot adds to delete message if env is debug
 *
 * */
const getDebugMessage = ({ message, byRules, startTime }) =>
  `
***DEBUG***
Message:
${message}

Ban reason:
${JSON.stringify(byRules)}

Logic type:
${env.USE_SERVER ? 'server' : 'local'}

Last deploy:
${startTime.toString()}
`.trim();

/**
 *
 * Message that bot sends on /statistics
 *
 * */
const getStatisticsMessage = ({
  adminsChatsCount,
  botRemovedCount,
  botStartTime,
  channelCount,
  groupCount,
  memberChatsCount,
  privateCount,
  superGroupsCount,
  totalSessionCount,
  totalUserCounts,
}) =>
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

<i>Статистика від:
${botStartTime}</i>
`.trim();

/**
 *
 * Help handler
 *
 * */
const getHelpMessage = ({ startLocaleTime }) =>
  `
<b>Якщо повідомлення було видалено помилково:</b>

• Попросіть адміністраторів написати його самостійно;
• Пришліть його скріншотом.

<b>Останнє оновлення боту:</b>

${startLocaleTime},

Якщо є запитання, пишіть ${creatorNick}
`.trim();

/**
 *
 * Message that bot will send when user uses /start in private
 *
 * */
const getStartMessage = () =>
  `
${startMessageAtom}

<b>Як мене запустити?</b>

Додай мене і зроби адміністратором:
• Або в звичайну групу;
• Або в чат каналу.

Якщо є запитання або бот не працює, пишіть ${creatorNick}
`.trim();

/**
 *
 * Message that bot sends when user uses /start in the group
 *
 * */
const getGroupStartMessage = ({ adminsString }) =>
  `
${makeAdminMessage}

${adminsString ? `Це може зробити: ${adminsString}` : 'Це може зробити творець чату'}
`.trim();

/**
 *
 * Message that bot sends when user invites it into a channel
 *
 * */
const getStartChannelMessage = ({ botName }) =>
  `
Привіт! Повідомлення від офіційного чат-боту @${botName}.
Ви мене додали в <b>канал</b> як адміністратора, але я не можу перевіряти повідомлення в коментарях.

Видаліть мене і додайте в <b>чат каналу</b> каналу <b>як адміністратора</b>.
Якщо є запитання, пишіть ${creatorNick}
`.trim();

/**
 *
 * Message when bot asks user what does he want to send to all private chats
 *
 * */
const getUpdatesMessage = () =>
  `
Напиши після цього повідомлення те, що ти хочеш відправити по всім активним сесіям:

`.trim();

/**
 *
 * Message that bots sends before confirmation
 *
 * */
const getConfirmationMessage = ({ userInput }) =>
  `
Ось що буде надіслано до чатів:\n\n${userInput}

`.trim();

/**
 *
 * Message that bots sends before confirmation
 *
 * */
const getSuccessfulMessage = ({ totalCount }) =>
  `
Загальна кількість унікальних приватних чатів та супер-груп: ${totalCount}.

`.trim();

/**
 *
 * Message that bot sends when user invites in into a group
 *
 * */
const getBotJoinMessage = ({ adminsString }) =>
  `
${startMessageAtom}

${getGroupStartMessage({ adminsString })}
`.trim();

/**
 * Test messages
 */
const getTensorTestResult = ({ chance, isSpam }) =>
  `
🎲 Шанс спаму - <b>${chance}</b>
🤔 Я вважаю...<b>${isSpam ? '✅ Це спам' : '⛔️ Це не спам'}</b>
`.trim();

/**
 *
 * Exports
 *
 * */
module.exports = {
  settingsDeleteItemMessage,
  settingsSubmitMessage,
  memberReadyMessage,
  adminReadyMessage,
  startAdminReadyMessage,
  spamDeleteMessage,
  somethingWentWrongMessage,
  cancelMessageSending,
  getDeclinedMassSendingMessage,
  getTensorTestResult,
  getSettingsMenuMessage,
  getBotJoinMessage,
  getStartMessage,
  getStartChannelMessage,
  getGroupStartMessage,
  getHelpMessage,
  getDebugMessage,
  getDeleteMessage,
  getStatisticsMessage,
  getUpdatesMessage,
  getConfirmationMessage,
  getSuccessfulMessage,
};

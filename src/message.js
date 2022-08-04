const { env } = require('typed-dotenv').config();

const { helpChat } = require('./creator');
const { getRandomItem } = require('./utils');

const randomBanEmojis = ['👮🏻‍♀️', '🤦🏼‍♀️', '🙅🏻‍♀️'];
const randomLocationBanEmojis = ['🏡', '🏘️', '🌳'];

/**
 * Generic
 * */
const adminReadyMessage = 'Тепер я адміністратор. Готовий до роботи 😎';
const adminReadyHasNoDeletePermissionMessage = 'Тепер я адміністратор. Але не маю права на видалення повідомлень 😢';
const startAdminReadyMessage = '✅ Я активований і виконую свою роботу';
const memberReadyMessage = 'Тепер я деактивований. Відпочиваю... 😴';
const spamDeleteMessage = '❗️ Повідомлення видалено.\n\n* Причина: спам.';
const somethingWentWrongMessage = 'Сталась якась помилка :(';
const makeAdminMessage = '⛔️ Я не активований.\n<b>☝️Зроби мене адміністратором, щоб я міг видаляти повідомлення.</b>';
const hasDeletePermissionMessage = '✅ Я маю права на видалення повідомлень';
const hasNoDeletePermissionMessage = '⛔ Я не маю права на видалення повідомлень';

/**
 * Generic - Swindlers
 * */
const swindlersUpdateStartMessage = 'Починаю оновлення списку шахраїв...';
const swindlersUpdateEndMessage = 'Оновлення спіску шахраїв завершено.';
const swindlersWarningMessage = `<b>❗УВАГА! UA Anti Spam Bot 🇺🇦 помітив повідомлення від шахраїв в цьому чаті!</b>

Будьте обережні та дотримуйтесь правил інформаційної безпеки:

🔶 Не переходьте за підозрілими посиланнями із чатів!
🔶 Уникайте реєстрацій та передачі персональних даних стороннім неперевіреним ресурсам.
🔶 Ніколи не вводьте захищені дані ваших платіжних карток (CVV-код та PIN).
`;

/**
 * Generic - Air alarm
 * */
const alarmStartMessage = `
Можливість відправляти повідомлення під час повітряної тривоги тимчасово заблокована!
`;
const alarmEndMessage = `
Блокування повідомлень зняті. Приємного спілкування!
`;

const alarmStartNotificationMessage = `
<b>❗ Увага! У вашому регіоні повітряна тривога! Пройдіть до укриття! 🔊</b>
`;

const alarmEndNotificationMessage = `
<b>❎ Відбій повітряної тривоги! 🔇</b>
`;
/**
 * Generic - Settings
 * */
const settingsAvailableMessage = '👨‍👩‍👧‍👦 Налаштування доступні тільки для групових чатів.';
const settingsDeleteItemMessage = 'Повідомлення про видалення';
const settingsSubmitMessage = '💾 Зберегти';
const cancelMessageSending = 'Розсилка була відмінена!';
/**
 * Complex - Settings
 * */

/**
 * @param {ChatSessionData['chatSettings']} settings
 * */
const getSettingsMenuMessage = (settings) =>
  `
<b>🤖 Налаштування бота в поточному чаті.</b>
Тут ви можете регулювати параметри.

🚀 ${settings.disableStrategicInfo === true ? '⛔️ Бот не видаляє стратегічну інформацію.' : '✅ Бот видаляє стратегічну інформацію.'}
❗ ${
    settings.disableStrategicInfo === true || settings.disableDeleteMessage === true
      ? '⛔️ Бот не повідомляє про видалену стратегічну інформацію.'
      : '✅ Бот повідомляє про видалену стратегічну інформацію.'
  }
💰 ${settings.disableSwindlerMessage === true ? '⛔️ Бот не видаляє повідомлення шахраїв.' : '✅ Бот видаляє повідомлення шахраїв.'}

<b>Налаштування повітряної тривоги.</b>
🏰 ${
    settings.airRaidAlertSettings.state
      ? `✅ ${settings.airRaidAlertSettings.state} - твій вибраний регіон.`
      : '⛔ Ти ще не вибрав свій регіон.'
  }
📢 ${
    settings.airRaidAlertSettings.notificationMessage === false
      ? '⛔️ Бот не повідомляє про початок і завершення повітряної тривоги у вашому регіоні.'
      : '✅ Бот повідомляє про початок і завершення повітряної тривоги у вашому регіоні.'
  }
🤫️ ${
    settings.disableChatWhileAirRaidAlert === false
      ? '⛔️ Бот не вимикає чат під час повітряної тривоги у вашому регіоні.'
      : '✅ Бот вимикає чат під час повітряної тривоги у вашому регіоні.'
  }

Для зміни налаштувань, натисніть на відповідну кнопку нижче. 👇
`.trim();

const getAirRaidAlarmSettingsMessage = (settings) =>
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

const settingsDescriptionButton = '📋 Опис налаштувань бота в поточному чаті';

const deleteTensorButton = `🚀 Інцидент`;
const deleteMessageButton = '❗ Причина';
const deleteSwindlerButton = '💰 Шахраї';

const airAlarmAlertButton = '🏰 Регіон';
const airAlarmNotificationMessage = '📢 Тривога';
const turnOffChatWhileAlarmButton = '🤫️ Тиша';

const goBackButton = '⬅️ Повернутись назад';

const nextPage = 'Наступна сторінка ⏩';
const previousPage = '⏪ Попередня сторінка';

const detailedSettingsDescription = '📋 Детальний опиc всіх налаштувань';

/**
 *
 * Message that bots sends before confirmation
 *
 * */
const confirmationMessage = `
 Ось що буде надіслано до чатів:
 `.trim();

/**
 * Complex
 * */
const startMessageAtom = `
Привіт! 🇺🇦✌️

Я чат-бот, який запобігає поширенню стратегічної інформації про переміщення ЗСУ, локації ворожих обстрілів та блокує фішингові повідомлення.
`.trim();

/**
 *
 * Message that bots sends if user has no rights to perform mass sending
 *
 * */
const getDeclinedMassSendingMessage = 'Вибач, але у тебе немає прав для цієї команди.😞'.trim();

/**
 *
 * Message that bot sends on delete
 *
 * */
const getDeleteMessage = ({ writeUsername, userId, wordMessage, debugMessage, withLocation }) =>
  `
❗️ ${userId && writeUsername ? `<a href="tg://user?id=${userId}">${writeUsername}</a>, <b>повідомлення` : '<b>Повідомлення'} видалено</b>.

${getRandomItem(withLocation ? randomLocationBanEmojis : randomBanEmojis)} <b>Причина</b>: поширення потенційно стратегічної інформації${
    withLocation ? ' з повідомленням локації' : ''
  }${wordMessage}.

✊🏻 «<b>єВорог</b>» — новий бот від Мінцифри, яким не зможуть скористатися окупанти.
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
const getHelpMessage = ({ startLocaleTime, isAdmin, canDelete, user, userId }) =>
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
`.trim();

/**
 *
 * Message that bot will send when user uses /start in private
 *
 * */
const getStartMessage = () =>
  `
${startMessageAtom}

<b>Щоб бот запрацював в чаті:</b>

• Додайте бот в чат;
• Зробіть бота адміністратором.

Розробник бота – @dimkasmile за підтримки Master of Code Global.
Якщо бот не працює, пишіть <a href="${helpChat}">чат підтримки</a>.

Дивись відео з інструкцією нижче:
https://youtu.be/RX0cZYf1Lm4
`.trim();

/**
 *
 * Message that bot sends when user uses /start in the group
 *
 * */
const getGroupStartMessage = ({ adminsString, isAdmin = false, canDelete, user = '', userId }) =>
  `
<a href="tg://user?id=${userId}">${user}</a>

${isAdmin ? startAdminReadyMessage : makeAdminMessage}
${canDelete ? hasDeletePermissionMessage : hasNoDeletePermissionMessage}

${((!isAdmin || !canDelete) && (adminsString ? `З цим може допомогти: ${adminsString}` : 'З цим може допомогти творець чату')) || ''}
`.trim();

const getCannotDeleteMessage = ({ adminsString }) =>
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
const getStartChannelMessage = ({ botName }) =>
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
const getUpdatesMessage = () =>
  `
Напиши після цього повідомлення те, що ти хочеш відправити по всім активним сесіям:

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
const getBotJoinMessage = ({ adminsString, isAdmin = false }) =>
  `
${startMessageAtom}

${getGroupStartMessage({ adminsString, isAdmin }).trim()}
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
  airAlarmNotificationMessage,
  alarmStartNotificationMessage,
  alarmEndNotificationMessage,
  nextPage,
  previousPage,
  airAlarmAlertButton,
  turnOffChatWhileAlarmButton,
  goBackButton,
  deleteMessageButton,
  deleteTensorButton,
  deleteSwindlerButton,
  detailedSettingsDescription,
  settingsAvailableMessage,
  settingsDescriptionButton,
  settingsDeleteItemMessage,
  settingsSubmitMessage,
  memberReadyMessage,
  adminReadyMessage,
  adminReadyHasNoDeletePermissionMessage,
  startAdminReadyMessage,
  spamDeleteMessage,
  somethingWentWrongMessage,
  cancelMessageSending,
  getDeclinedMassSendingMessage,
  confirmationMessage,
  swindlersUpdateStartMessage,
  swindlersUpdateEndMessage,
  swindlersWarningMessage,
  alarmStartMessage,
  alarmEndMessage,
  getAirRaidAlarmSettingsMessage,
  getBotJoinMessage,
  getCannotDeleteMessage,
  getDebugMessage,
  getDeleteMessage,
  getGroupStartMessage,
  getHelpMessage,
  getSettingsMenuMessage,
  getStartChannelMessage,
  getStartMessage,
  getStatisticsMessage,
  getSuccessfulMessage,
  getTensorTestResult,
  getUpdatesMessage,
};

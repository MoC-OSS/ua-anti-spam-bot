const { env } = require('typed-dotenv').config();

const { creatorNick } = require('./creator');

const adminReadyMessage = 'Тепер я адміністратор. Готовий до роботи 😎';
const memberReadyMessage = 'Тепер я деактивований. Відпочиваю... 😴';
const spamDeleteMessage = '❗️ Повідомлення видалено.\n\n* Причина: спам.';
const makeAdminMessage = '<b>Зроби мене адміністратором, щоб я міг видаляти повідомлення.</b>';

const startMessageAtom = `
Привіт! 🇺🇦✌️

Я чат-бот, який дозволяє автоматично видаляти повідомлення, що містять назви локацій міста, укриттів, а також ключові слова переміщення військ.
`.trim();

/**
 *
 * Message that bot sends on delete
 *
 * */
const getDeleteMessage = ({ writeUsername, wordMessage, debugMessage }) =>
  `
❗️ ${writeUsername} Повідомлення видалено.

* Причина: поширення потенційно стратегічної інформації${wordMessage}.

Сповіщайте про ворогів спеціальному боту: @stop_russian_war_bot

ФОРМАТ:
- Час
- Місто, область
- Опис техніки, рухається чи стоїть
- GPS координати (нижче як це зробити)
- ваші контакти для наводки/уточнень

ПРИКЛАД:
8:17
м. Городня, Чернигівська область
В посадці стоять БУКи, не рухаються, повернуті в сторону міста Чернигів
1й - 51.90923162814216, 31.64663725415263
2й - 51.90888217358738, 31.646019721862935
3й - 51.91023752682623, 31.64119240319336
Степан 067 777 77 77



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
}) =>
  `
<b>Кількість всіх чатів: ${totalSessionCount}</b> 🎉

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
 * Message that bot sends when user invites in into a group
 *
 * */
const getBotJoinMessage = ({ adminsString }) =>
  `
${startMessageAtom}

${getGroupStartMessage({ adminsString })}
`.trim();

/**
 *
 * Exports
 *
 * */
module.exports = {
  memberReadyMessage,
  adminReadyMessage,
  spamDeleteMessage,
  getBotJoinMessage,
  getStartMessage,
  getStartChannelMessage,
  getGroupStartMessage,
  getHelpMessage,
  getDebugMessage,
  getDeleteMessage,
  getStatisticsMessage,
};

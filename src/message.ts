import moment from 'moment-timezone';

import type { CustomJsonObject } from './types/object';
import { environmentConfig } from './config';
import { helpChat } from './creator';
import type { ChatSessionData } from './types';
import { formatStateIntoAccusative, getRandomItem } from './utils';

export const randomBanEmojis = ['👮🏻‍♀️', '🤦🏼‍♀️', '🙅🏻‍♀️'];
export const randomLocationBanEmojis = ['🏡', '🏘️', '🌳'];

function getCurrentTimeAndDate() {
  return moment().format('LT');
}

/**
 * Generic
 * */
export const adminReadyMessage = 'Тепер я адміністратор. Готовий до роботи 😎';
export const adminReadyHasNoDeletePermissionMessage = 'Тепер я адміністратор. Але не маю права на видалення повідомлень 😢';
export const startAdminReadyMessage = '✅ Я активований і виконую свою роботу';
export const memberReadyMessage = 'Тепер я деактивований. Відпочиваю... 😴';
export const spamDeleteMessage = '❗️ Повідомлення видалено.\n\n* Причина: спам.';
export const somethingWentWrongMessage = 'Сталась якась помилка :(';
export const makeAdminMessage = '⛔️ Я не активований.\n<b>☝️Зроби мене адміністратором, щоб я міг видаляти повідомлення.</b>';
export const hasDeletePermissionMessage = '✅ Я маю права на видалення повідомлень';
export const hasNoDeletePermissionMessage = '⛔ Я не маю права на видалення повідомлень';

/**
 * Generic - Swindlers
 * */
export const swindlersUpdateStartMessage = 'Починаю оновлення списку шахраїв...';
export const swindlersUpdateEndMessage = 'Оновлення спіску шахраїв завершено.';
export const swindlersWarningMessage = `<b>❗УВАГА! UA Anti Spam Bot 🇺🇦 помітив повідомлення від шахраїв в цьому чаті!</b>

Будьте обережні та дотримуйтесь правил інформаційної безпеки:

🔶 Не переходьте за підозрілими посиланнями із чатів!
🔶 Уникайте реєстрацій та передачі персональних даних стороннім неперевіреним ресурсам.
🔶 Ніколи не вводьте захищені дані ваших платіжних карток (CVV-код та PIN).
`;

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
 * */
export const getAlarmStartNotificationMessage = (settings: ChatSessionData['chatSettings']) => `
🔴 <b> ${getCurrentTimeAndDate()} Повітряна тривога в ${formatStateIntoAccusative(settings.airRaidAlertSettings.state || '')}!</b>
${getRandomAlarmStartText()}
`;

/**
 * @param {ChatSessionData['chatSettings']} settings
 * */
export const alarmEndNotificationMessage = (settings: ChatSessionData['chatSettings']) => `
🟢 <b>${getCurrentTimeAndDate()} Відбій тривоги в ${formatStateIntoAccusative(settings.airRaidAlertSettings.state || '')}!</b>
${getRandomAlarmEndText()}
`;
/**
 * Generic - Settings
 * */
export const settingsAvailableMessage = '👨‍👩‍👧‍👦 Налаштування доступні тільки для групових чатів.';
export const settingsDeleteItemMessage = 'Повідомлення про видалення';
export const settingsSubmitMessage = '💾 Зберегти';
export const englishSettingsSubmitMessage = '💾 Save';
export const cancelMessageSending = 'Розсилка була відмінена!';
/**
 * Complex - Settings
 * */

/**
 * @param {ChatSessionData['chatSettings']} settings
 * */
export const getSettingsMenuMessage = (settings: ChatSessionData['chatSettings']) =>
  `
<b>🤖 Налаштування бота в поточному чаті.</b>
Тут ви можете регулювати параметри.

🚀 ${settings.disableStrategicInfo ? '⛔️ Бот не видаляє стратегічну інформацію.' : '✅ Бот видаляє стратегічну інформацію.'}
❗ ${
    settings.disableStrategicInfo || settings.disableDeleteMessage
      ? '⛔️ Бот не повідомляє про видалену стратегічну інформацію.'
      : '✅ Бот повідомляє про видалену стратегічну інформацію.'
  }
💰 ${settings.disableSwindlerMessage ? '⛔️ Бот не видаляє повідомлення шахраїв.' : '✅ Бот видаляє повідомлення шахраїв.'}

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
🤫 ${
    settings.disableChatWhileAirRaidAlert === false
      ? '⛔️ Бот не вимикає чат під час повітряної тривоги у вашому регіоні.'
      : '✅ Бот вимикає чат під час повітряної тривоги у вашому регіоні.'
  }

Для зміни налаштувань, натисніть на відповідну кнопку нижче. 👇
`.trim();

/**
 * @param {ChatSessionData['chatSettings']} settings
 * */
export const getEnglishSettingsMenuMessage = (settings: ChatSessionData['chatSettings']) =>
  `
<b>🤖 Bot Settings</b>
Here you can adjust the settings:

🚀 ${
    settings.disableStrategicInfo === true
      ? '⛔️ Do not delete messages containing strategic information.'
      : '✅ Delete messages containing strategic information.'
  }
❗ ${
    settings.disableStrategicInfo === true || settings.disableDeleteMessage === true
      ? '⛔️ Do not post reports on the removed messages containing strategic information.'
      : '✅ Post reports on the removed messages containing strategic information.'
  }
💰 ${settings.disableSwindlerMessage === true ? '⛔️ Do not detect and delete scam messages.' : '✅ Detect and delete scam messages.'}

<b>Air raid alarm settings:</b>
🏰 ${settings.airRaidAlertSettings.state ? `✅ Your region is ${settings.airRaidAlertSettings.state}.` : '⛔ No region is selected.'}
📢 ${
    settings.airRaidAlertSettings.notificationMessage === false
      ? '⛔️ Do not notify about the start and end of an air alert in your region.'
      : '✅ Notify about the start and end of an air alert in your region.'
  }
🤫 ${
    settings.disableChatWhileAirRaidAlert === false
      ? '⛔️ Do not disable the chat during an air alert in your region.'
      : '✅ Disable the chat during an air alert in your region.'
  }

To change the setting, click the appropriate button below. 👇
`.trim();

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

export const settingsDescriptionButton = '📋 Опис налаштувань бота в поточному чаті';

/**
 * Ukrainian buttons
 * */
export const deleteTensorButton = `🚀 Інцидент`;
export const deleteMessageButton = '❗ Причина';
export const deleteSwindlerButton = '💰 Шахраї';

export const airAlarmAlertButton = '🏰 Регіон';
export const airAlarmNotificationMessage = '📢 Тривога';
export const turnOffChatWhileAlarmButton = '🤫 Тиша';

/**
 * English buttons
 * */
export const englishDeleteTensorButton = `🚀 Incident`;
export const englishDeleteMessageButton = '❗ Reason';
export const englishDeleteSwindlerButton = '💰 Scam';

export const englishAirAlarmAlertButton = '🏰 Region';
export const englishAirAlarmNotificationMessage = '📢 Alarm';
export const englishTurnOffChatWhileAlarmButton = '🤫 Silent';

export const goBackButton = '⬅️ Повернутись назад';

export const nextPage = 'Наступна сторінка ⏩';
export const previousPage = '⏪ Попередня сторінка';

export const selectYourState = 'Будь ласка, виберіть свій регіон.';

export const blockWhenAlarm = 'Це налаштування заблоковано під час тривоги. Будь ласка, зробіть це після відміни тривоги.';

export const detailedSettingsDescription = '📋 Детальний опиc всіх налаштувань';

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

Я чат-бот, який запобігає поширенню стратегічної інформації про переміщення ЗСУ, локації ворожих обстрілів та блокує фішингові повідомлення.
`.trim();

/**
 *
 * Message that bots sends if user has no rights to perform mass sending
 *
 * */
export const getDeclinedMassSendingMessage = 'Вибач, але у тебе немає прав для цієї команди.😞'.trim();

export interface DeleteMessageProperties {
  writeUsername: string;
  userId?: number;
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
❗️ ${userId && writeUsername ? `<a href="tg://user?id=${userId}">${writeUsername}</a>, <b>повідомлення` : '<b>Повідомлення'} видалено</b>.

${getRandomItem(withLocation ? randomLocationBanEmojis : randomBanEmojis)} <b>Причина</b>: поширення потенційно стратегічної інформації${
    withLocation ? ' з повідомленням локації' : ''
  }${wordMessage}.

✊🏻 «<b>єВорог</b>» — новий бот від Мінцифри, яким не зможуть скористатися окупанти.
Повідомляйте цю інформацію йому.

👉🏻 @evorog_bot



${debugMessage}`.trim();

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

export interface StatisticsMessageProperties {
  adminsChatsCount: number;
  botRemovedCount: number;
  botStartTime: string;
  channelCount: number;
  groupCount: number;
  memberChatsCount: number;
  privateCount: number;
  superGroupsCount: number;
  totalSessionCount: number;
  totalUserCounts: number;
}

/**
 *
 * Message that bot sends on /statistics
 *
 * */
export const getStatisticsMessage = ({
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
}: StatisticsMessageProperties) =>
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

export interface HelpMessageProperties {
  startLocaleTime: string;
  isAdmin?: boolean;
  canDelete: boolean;
  user: string;
  userId: number;
}

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
`.trim();

/**
 *
 * Message that bot will send when user uses /start in private
 *
 * */
export const getStartMessage = () =>
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

export interface StartChannelMessageProperties {
  botName: string;
}

/**
 *
 * Message that bot sends when user invites it into a channel
 *
 * */
export const getStartChannelMessage = ({ botName }: StartChannelMessageProperties) =>
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
}

/**
 *
 * Message that bot sends when user invites in into a group
 *
 * */
export const getBotJoinMessage = ({ adminsString, isAdmin = false }: BotJoinMessageProperties) =>
  `
${startMessageAtom}

${getGroupStartMessage({ adminsString, isAdmin, canDelete: false, user: undefined, userId: undefined }).trim()}
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

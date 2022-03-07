const blockMessage = `ФОРМАТ:
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
Степан 067 777 77 77`;

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

module.exports = {
  blockMessage,
  getStatisticsMessage,
};

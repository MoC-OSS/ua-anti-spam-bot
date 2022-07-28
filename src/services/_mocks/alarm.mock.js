const getAlarmMock = (alert = false) => ({
  state: {
    alert,
    id: 12,
    name: 'Львівська область',
    name_en: 'Lviv oblast',
    changed: '2022-04-05T06:14:56+03:00',
  },
  notification_id: 'b7b5cb85-ddc0-11ec-90d3-c8b29b63332d',
});

module.exports = {
  getAlarmMock,
};

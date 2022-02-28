class MessageUtil {
  findInText(message, searchFor) {
    return message.replace(/ /g, '').toLowerCase().includes(searchFor.toLowerCase());
  }
}

module.exports = {
  MessageUtil,
};

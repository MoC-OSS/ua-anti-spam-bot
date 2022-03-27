const { Menu } = require('@grammyjs/menu');

// const { getUpdatesMessage } = require('../../message');
const menu = new Menu('approveUpdatesMenu')
  .text({ text: 'Піддверджую', payload: 'approve' })
  .row()
  .text({ text: 'Відмінити', payload: 'cancel' });

class UpdatesInputMiddleware {
  middleware() {
    /**
     * @param {GrammyContext} ctx
     * */
    return (ctx) => {
      const userInput = ctx.msg?.text;
      ctx.session.updatesText = userInput;
      ctx.session.step = 'updatesConfirmation';
      ctx.reply(`Ось що буде надіслано до чатів:\n\n${userInput}`, { reply_markup: menu });
    };
  }
}

module.exports = {
  UpdatesInputMiddleware,
};

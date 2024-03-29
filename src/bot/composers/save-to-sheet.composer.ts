import { Menu } from '@grammyjs/menu';
import { Composer } from 'grammy';
import { isChatId } from 'grammy-guard';

import { messageQuery } from '../../const';
import type { swindlersGoogleService } from '../../services';
import type { GrammyContext, GrammyMenuContext } from '../../types';
import { onlyWithText, parseText, removeSystemInformationMiddleware } from '../middleware';

export interface SaveToSheetComposerProperties {
  chatId: number;
  rootMenu: Menu<GrammyMenuContext>;
  updateMethod: typeof swindlersGoogleService.appendBot;
}

export const getSaveToSheetComposer = ({ chatId, rootMenu, updateMethod }: SaveToSheetComposerProperties) => {
  const saveToSheetComposer = new Composer<GrammyContext>();

  const composer = saveToSheetComposer.filter(isChatId(chatId));

  const menu = new Menu<GrammyMenuContext>(`saveToSheetMenu_${chatId}`);

  menu
    .text('✅ Додати в базу', async (context) => {
      await context.deleteMessage();
      await updateMethod(context.msg?.text || `$no_value_${chatId}`).catch(() =>
        context.reply('Дуже погана помилка, терміново подивіться sheet!'),
      );
    })
    .text('⛔️ Не спам', async (context) => {
      await context.deleteMessage();
    });

  composer.on(messageQuery, parseText, onlyWithText, removeSystemInformationMiddleware, async (context) => {
    const text = context.state.clearText!;

    await context.deleteMessage();
    await context.reply(text, {
      reply_markup: menu,
    });
  });

  rootMenu.register(menu);

  return { saveToSheetComposer, menu };
};

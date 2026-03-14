import { Menu } from '@grammyjs/menu';
import { Composer } from 'grammy';
import { isChatHasId } from 'grammy-guard';

import { onlyWithText } from '@bot/middleware/only-with-text.middleware';
import { parseText } from '@bot/middleware/parse-text.middleware';
import { removeSystemInformationMiddleware } from '@bot/middleware/remove-system-information.middleware';

import { messageQuery } from '@const/message-query.const';

import type { swindlersGoogleService } from '@services/swindlers-google.service';

import type { GrammyContext, GrammyMenuContext } from '@app-types/context';

export interface SaveToSheetComposerProperties {
  chatId: number;
  rootMenu: Menu<GrammyMenuContext>;
  updateMethod: typeof swindlersGoogleService.appendBot;
}

export const getSaveToSheetComposer = ({ chatId, rootMenu, updateMethod }: SaveToSheetComposerProperties) => {
  const saveToSheetComposer = new Composer<GrammyContext>();

  const composer = saveToSheetComposer.filter(isChatHasId(chatId));

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

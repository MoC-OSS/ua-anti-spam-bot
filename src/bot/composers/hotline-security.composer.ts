import { Composer } from 'grammy';

import { swindlersHelpMessage } from '../../message';
import type { GrammyContext } from '../../types';
import { ignoreOld } from '../middleware';

const mainPhotoFileId = 'AgACAgIAAxkBAAI3PGUdLT60yhtl3GLyAgXYSZ1IjO2NAALSzTEbKALoSCJ7nmsSxICQAQADAgADeAADMAQ';

/**
 * @description Health-check helper composer
 * */
export const getHotlineSecurityComposer = () => {
  const hotlineSecurityComposer = new Composer<GrammyContext>();

  hotlineSecurityComposer.command('hotline_security', ignoreOld(30), async (context) => {
    await context.replyWithPhotoWithSelfDestructedHTML(mainPhotoFileId, { caption: swindlersHelpMessage });
  });

  return { hotlineSecurityComposer };
};

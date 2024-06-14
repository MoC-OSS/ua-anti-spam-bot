import path from 'node:path';
import { apiThrottler } from '@grammyjs/transformer-throttler';
import { Composer, InputFile } from 'grammy';
import type { ApiMethods } from 'typegram';

import type { GrammyContext } from '../../types';
import { getTypedValue, handleError } from '../../utils';
import { onlyCreatorFilter } from '../filters';

type IconColor = Parameters<ApiMethods<void>['createForumTopic']>[0]['icon_color'];

const iconColors = getTypedValue<Record<string, IconColor>>()({
  bittersweet: 0xfb_6f_5f, // red
  salomie: 0xff_d6_7e, // yellow
  lightGreen: 0x8e_ee_98, // green
  mayaBlue: 0x6f_b9_f0, // blue
  wisteria: 0xcb_86_db, // violet
  illusion: 0xff_93_b2, // purple
});

const groupPhotoPath = path.resolve('./src/assets/logs-chat-profile-photo.jpeg');
const groupPhotoFile = new InputFile(groupPhotoPath);

/**
 * @description Creates all thread in forum for logs
 * */
export const getCreateLogsChatComposer = () => {
  const createLogsChatComposer = new Composer<GrammyContext>();

  const composer = createLogsChatComposer.filter((context) => onlyCreatorFilter(context));

  composer.use((context, next) => {
    context.api.config.use(apiThrottler());
    return next();
  });

  // Command to prepare chat for logs
  composer.command('prepare_logs_chat', async (context) => {
    await context.reply('Preparing chat photo, title, and description...');

    await context.setChatPhoto(groupPhotoFile).catch(handleError);
    await context.setChatTitle('UA Anti Spam Bot - Logs 🇺🇦 V2').catch(handleError);
    await context.setChatDescription('Форум-група, де ми збираємо логи з усіх чатів.').catch(handleError);

    await context.reply('Creating topics... It takes up to 1-2 minutes.');

    const pornTopic = await context.createForumTopic('Porn', {
      icon_color: iconColors.bittersweet,
    });
    const swindlersTopic = await context.createForumTopic('Swindlers', { icon_color: iconColors.salomie });
    const antiRussianTopic = await context.createForumTopic('Anti-Russian', { icon_color: iconColors.illusion });
    const strategicTopic = await context.createForumTopic('Strategic', { icon_color: iconColors.mayaBlue });
    const cardsTopic = await context.createForumTopic('Cards', { icon_color: iconColors.lightGreen });
    const urlsTopic = await context.createForumTopic('URLs', { icon_color: iconColors.wisteria });
    const locationTopic = await context.createForumTopic('Location', { icon_color: iconColors.bittersweet });
    const mentionsTopic = await context.createForumTopic('Mentions', { icon_color: iconColors.salomie });
    const counterOffensiveTopic = await context.createForumTopic('Counter-Offensive', { icon_color: iconColors.illusion });
    const obsceneTopic = await context.createForumTopic('Obscene', { icon_color: iconColors.mayaBlue });
    const antiSemitismTopic = await context.createForumTopic('Anti-Semitism', { icon_color: iconColors.lightGreen });

    const topics = [
      pornTopic,
      swindlersTopic,
      antiRussianTopic,
      strategicTopic,
      cardsTopic,
      urlsTopic,
      locationTopic,
      mentionsTopic,
      counterOffensiveTopic,
      obsceneTopic,
      antiSemitismTopic,
    ];

    await Promise.all(
      topics.map((topic) =>
        context.reply(`Topic ${topic.name} created! Topic id: ${topic.message_thread_id}`, {
          reply_to_message_id: topic.message_thread_id,
        }),
      ),
    );

    return context.replyWithHTML(`The group is ready and all topics created! Chat ID is <pre>${context.chat.id}</pre>`);
  });

  // Command to prepare second chat for logs
  composer.command('prepare_second_logs_chat', async (context) => {
    await context.reply('Preparing chat photo, title, and description...');

    await context.setChatPhoto(groupPhotoFile).catch(handleError);
    await context.setChatTitle('UA Anti Spam Bot - Logs 🇺🇦 V2 Second').catch(handleError);

    await context.reply('Creating topics... It takes up to 1-2 minutes.');

    const swindlersTopic = await context.createForumTopic('Шахраї', { icon_color: iconColors.salomie });

    const topics = [swindlersTopic];

    await Promise.all(
      topics.map((topic) =>
        context.reply(`Topic ${topic.name} created! Topic id: ${topic.message_thread_id}`, {
          reply_to_message_id: topic.message_thread_id,
        }),
      ),
    );

    return context.replyWithHTML(`The group is ready and all topics created! Chat ID is <pre>${context.chat.id}</pre>`);
  });

  return { createLogsChatComposer };
};

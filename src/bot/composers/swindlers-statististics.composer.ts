import type { InputFile } from 'grammy';
import { Composer } from 'grammy';

import { noNewStatisticMessage } from '../../message';
import { redisService, swindlersGoogleService } from '../../services';
import type { GrammyContext } from '../../types';
import { removeDuplicates } from '../../utils';
import { setOfArraysDiff } from '../../utils/array-diff.util';
import { csvConstructor } from '../../utils/csv.util';
import { onlySwindlersStatisticWhitelistedFilter } from '../filters/only-swindlers-statistic-whitelisted';

const FILE_NAME = 'statistic';

const statisticToCsv = (data: { [key: string]: string[] }): InputFile => {
  const headers = Object.keys(data);
  const columns = Object.values(data);
  return csvConstructor(headers, columns, FILE_NAME);
};

const getStatisticFromSheet = async (): Promise<{ [key: string]: string[] }> => {
  const statistic = Promise.all([
    swindlersGoogleService.getTrainingPositives(true),
    swindlersGoogleService.getBots(),
    swindlersGoogleService.getDomains(),
    swindlersGoogleService.getNotSwindlers(),
    swindlersGoogleService.getCards(),
    swindlersGoogleService.getSiteRegex(),
  ]);

  return statistic.then(([swindlerPositives, swindlerBots, swindlerDomains, notSwindlers, swindlerCards, swindlerRegexSites]) => ({
    swindlerPositives: removeDuplicates(swindlerPositives),
    swindlerBots: removeDuplicates(swindlerBots),
    swindlerDomains: removeDuplicates(swindlerDomains),
    notSwindlers: removeDuplicates(notSwindlers),
    swindlerCards: removeDuplicates(swindlerCards),
    swindlerRegexSites: removeDuplicates(swindlerRegexSites),
  }));
};

export const getSwindlersStatisticCommandsComposer = () => {
  const swindlersStatisticComposer = new Composer<GrammyContext>();

  const composer = swindlersStatisticComposer.filter((context) => onlySwindlersStatisticWhitelistedFilter(context));
  composer.command('get_all_statistic', async (context) => {
    const fromSheet = await getStatisticFromSheet();
    return context.replyWithDocument(statisticToCsv(fromSheet));
  });

  composer.command('get_new_statistic', async (context) => {
    const fromSheet = await getStatisticFromSheet();
    const currentStatistic = await redisService.getSwindlersStatistic();
    if (Object.keys(currentStatistic).length === 0) {
      await redisService.setSwindlersStatistic(fromSheet);
      return context.replyWithDocument(statisticToCsv(fromSheet));
    }
    const diff = setOfArraysDiff(currentStatistic, fromSheet);
    const isNoDiff = Object.values(diff).every((array) => array.length === 0);
    if (isNoDiff) {
      return context.reply(noNewStatisticMessage);
    }
    await redisService.setSwindlersStatistic(fromSheet);
    return context.replyWithDocument(statisticToCsv(diff));
  });

  return { swindlersStatisticComposer };
};

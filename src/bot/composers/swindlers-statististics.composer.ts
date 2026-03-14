import type { InputFile } from 'grammy';
import { Composer } from 'grammy';

import { onlySwindlersStatisticWhitelistedFilter } from '@bot/filters/only-swindlers-statistic-whitelisted';

import { noNewStatisticMessage } from '@message/';

import { redisService, swindlersGoogleService } from '@services/';

import type { GrammyContext } from '@types/';

import { removeDuplicates } from '@utils/';
import { setOfArraysDiff } from '@utils/array-diff.util';
import { csvConstructor } from '@utils/csv.util';

const FILE_NAME = 'statistic';

interface StatisticToCsvData {
  [key: string]: string[];
}

const statisticToCsv = (data: StatisticToCsvData): InputFile => {
  const headers = Object.keys(data);
  const columns = Object.values(data);

  return csvConstructor(headers, columns, FILE_NAME);
};

interface GetStatisticFromSheetReturn {
  [key: string]: string[];
}

const getStatisticFromSheet = async (): Promise<GetStatisticFromSheetReturn> => {
  const statistic = Promise.all([
    swindlersGoogleService.getTrainingPositives(true),
    swindlersGoogleService.getBots(),
    swindlersGoogleService.getDomains(),
    swindlersGoogleService.getNotSwindlers(),
    swindlersGoogleService.getCards(),
    swindlersGoogleService.getSiteRegex(),
  ]);

  return statistic.then((data) => {
    const [swindlerPositives, swindlerBots, swindlerDomains, notSwindlers, swindlerCards, swindlerRegexSites] = data.map((element) =>
      removeDuplicates(element),
    );

    return {
      swindlerPositives,
      swindlerBots,
      swindlerDomains,
      notSwindlers,
      swindlerCards,
      swindlerRegexSites,
    };
  });
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

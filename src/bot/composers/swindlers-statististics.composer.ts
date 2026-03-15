import type { InputFile } from 'grammy';
import { Composer } from 'grammy';

import { onlySwindlersStatisticWhitelistedFilter } from '@bot/filters/only-swindlers-statistic-whitelisted';

import { redisService } from '@services/redis.service';
import { swindlersGoogleService } from '@services/swindlers-google.service';

import type { GrammyContext } from '@app-types/context';

import { setOfArraysDiff } from '@utils/array-diff.util';
import { csvConstructor } from '@utils/csv.util';
import { removeDuplicates } from '@utils/remove-duplicates.util';

const FILE_NAME = 'statistic';

interface StatisticToCsvData {
  [key: string]: string[];
}

const statisticToCsv = (payload: StatisticToCsvData): InputFile => {
  const headers = Object.keys(payload);
  const columns = Object.values(payload);

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

  return statistic.then((payload) => {
    const [swindlerPositives, swindlerBots, swindlerDomains, notSwindlers, swindlerCards, swindlerRegexSites] = payload.map((element) =>
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
      return context.reply(context.t('no-new-statistic'));
    }

    await redisService.setSwindlersStatistic(fromSheet);

    return context.replyWithDocument(statisticToCsv(diff));
  });

  return { swindlersStatisticComposer };
};

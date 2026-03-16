import { redisService } from '@services/redis.service';

import type { TensorService } from '@tensor/tensor.service';

import type { GrammyCommandMiddleware } from '@app-types/context';

export class RankCommand {
  constructor(private tensorService: TensorService) {}

  /**
   * Returns middleware that gets or sets the tensor spam detection rank.
   * @returns The Grammy command middleware function for /set_rank.
   */
  setRankMiddleware(): GrammyCommandMiddleware {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context) => {
      const newPercent = +context.match;

      if (!context.match) {
        const percent = await redisService.getBotTensorPercent();

        return context.reply(`Current rank is: ${percent || 9999}`);
      }

      if (Number.isNaN(newPercent)) {
        return context.reply(`Cannot parse is as a number:\n${context.match}`);
      }

      this.tensorService.setSpamThreshold(newPercent);
      await redisService.setBotTensorPercent(newPercent);

      return context.reply(`Set new tensor rank: ${newPercent}`);
    };
  }

  /**
   * Returns middleware that gets or sets the training start rank threshold.
   * @returns The Grammy command middleware function for /set_training_start_rank.
   */
  setTrainingStartRank(): GrammyCommandMiddleware {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context) => {
      const newPercent = +context.match;

      if (!context.match) {
        const percent = await redisService.getTrainingStartRank();

        return context.reply(`Current training start rank is: ${percent || 9998}`);
      }

      if (Number.isNaN(newPercent)) {
        return context.reply(`Cannot parse is as a number:\n${context.match}`);
      }

      await redisService.setTrainingStartRank(newPercent);

      return context.reply(`Set new training start rank rank: ${newPercent}`);
    };
  }

  /**
   * Returns middleware that gets or sets the training chat whitelist.
   * @returns The Grammy command middleware function for /set_training_chat_whitelist.
   */
  setTrainingChatWhitelist(): GrammyCommandMiddleware {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context) => {
      const newChats = context.match;

      if (!context.match) {
        const whitelist = await redisService.getTrainingChatWhitelist();

        return context.reply(`Current training chat whitelist is:\n\n${whitelist.join(',')}`);
      }

      await redisService.setTrainingChatWhitelist(newChats);

      return context.reply(`Set training chat whitelist is:\n\n${newChats}`);
    };
  }

  /**
   * Returns middleware that appends a chat to the training whitelist.
   * @returns The Grammy command middleware function for /update_training_chat_whitelist.
   */
  updateTrainingChatWhitelist(): GrammyCommandMiddleware {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context) => {
      const newChats = context.match;

      if (!context.match) {
        const whitelist = await redisService.getTrainingChatWhitelist();

        return context.reply(`Current training chat whitelist is:\n\n${whitelist.join(',')}`);
      }

      await redisService.updateTrainingChatWhitelist(newChats);

      return context.reply(`Set training chat whitelist is:\n\n${newChats}`);
    };
  }
}

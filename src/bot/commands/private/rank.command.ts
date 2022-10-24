import { redisService } from '../../../services';
import type { TensorService } from '../../../tensor';
import type { GrammyCommandMiddleware } from '../../../types';

export class RankCommand {
  constructor(private tensorService: TensorService) {}

  /**
   * @command /set_rank
   * */
  setRankMiddleware(): GrammyCommandMiddleware {
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
   * @command /set_training_start_rank
   * */
  setTrainingStartRank(): GrammyCommandMiddleware {
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
   * @command /set_training_chat_whitelist
   * */
  setTrainingChatWhitelist(): GrammyCommandMiddleware {
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
   * @command /update_training_chat_whitelist
   * */
  updateTrainingChatWhitelist(): GrammyCommandMiddleware {
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

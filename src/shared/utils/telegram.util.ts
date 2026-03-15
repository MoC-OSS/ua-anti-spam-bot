/**
 * @module telegram.util
 * @description Utility class for common Telegram-related operations such as
 * checking user roles, extracting chat info, and building admin lists.
 */

import type { Chat, User } from '@grammyjs/types/manage';
import type { ChatFullInfo } from 'grammy/types';

import type { ChatMemberOwner } from 'typegram';

import type { GrammyContext } from '@app-types/context';

import { getUserData } from './generic.util';

export class TelegramUtility {
  /**
   * Checks if the message was forwarded from a linked channel rather than sent by a user.
   *
   * @param {GrammyContext} context
   * @returns {boolean}
   * */
  isFromChannel(context: GrammyContext): boolean {
    return context.from?.first_name === 'Channel' && context.from?.username === 'Channel_Bot';
  }

  /**
   * Returns the chat title, or a placeholder if unavailable.
   * */
  getChatTitle(chat?: Chat): string {
    return (chat && 'title' in chat && chat.title) || '$title';
  }

  /**
   * Extracts the invite link from chat info, if available.
   * */
  getInviteLink(chatInfo: ChatFullInfo): string | undefined {
    return ('invite_link' in chatInfo && chatInfo.invite_link) || undefined;
  }

  /**
   * Fetches the chat administrators and returns the creator, promotable admins, and a formatted string.
   *
   * @param {GrammyContext} context
   * @param {number} chatId
   */
  getChatAdmins(context: GrammyContext, chatId: number) {
    return context.api.getChatAdministrators(chatId).then((admins) => {
      if (!admins || admins.length === 0) {
        return {};
      }

      const creator = admins.find((user) => user.status === 'creator' && !!user.user.username) as ChatMemberOwner;
      const promoteAdmins = admins.filter((user) => user.status === 'creator' || (user.can_promote_members && !!user.user.username));

      const finalAdmins = [...new Set([creator, ...promoteAdmins].filter(Boolean))];
      const adminsString = finalAdmins.length > 0 ? `${finalAdmins.map((user) => this.getUserMentionOrName(user.user)).join(', ')} ` : '';

      return { creator, admins, promoteAdmins, adminsString, finalAdmins };
    });
  }

  /**
   * Returns the user's @username mention, or their full name if no username is set.
   *
   * @param {User} user
   */
  getUserMentionOrName(user: User): string {
    if (user.username) {
      return `@${user.username}`;
    }

    // eslint-disable-next-line sonarjs/no-nested-template-literals
    return `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}`;
  }

  /**
   * Get logs message parts for save a message into logs
   * */
  async getLogsSaveMessageParts(context: GrammyContext) {
    const { writeUsername, userId } = getUserData(context);
    const chatInfo = await context.getChat();

    const chatTitle = this.getChatTitle(context.chat);
    const inviteLink = this.getInviteLink(chatInfo);

    const chatMention = chatTitle && (inviteLink ? `<a href="${inviteLink}">${chatTitle}</a>` : `<code>${chatTitle}</code>`);

    const userMention = userId ? `<a href="tg://user?id=${userId}">${writeUsername}</a>` : writeUsername;

    return { userMention, chatMention };
  }
}

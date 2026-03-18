/**
 * @module role.command
 * @description Handles the /role command that lets chat administrators
 * temporarily test moderation as a regular user within the current chat.
 */

import type { GrammyCommandMiddleware } from '@app-types/context';
import type { RoleMode } from '@app-types/session';

const USER_ROLE_MODE: RoleMode = 'user';

/**
 * Returns true when the provided command argument is a supported role switch value.
 * @param value - Raw command argument.
 * @returns True for `user` or `admin`, false otherwise.
 */
function isSupportedRole(value: string): value is 'admin' | 'user' {
  return ['user', 'admin'].includes(value);
}

/** Handles the /role command for admin self-testing. */
export class RoleCommand {
  /**
   * Returns the Grammy middleware for the /role command.
   * @returns The command middleware.
   */
  middleware(): GrammyCommandMiddleware {
    // eslint-disable-next-line unicorn/consistent-function-scoping
    return async (context) => {
      const rawArgument = context.match?.toString().trim().toLowerCase() ?? '';
      const isPrivateChat = context.chat?.type === 'private';
      const isAnonymousAdmin = context.from?.username === 'GroupAnonymousBot';
      const isActualUserAdmin = Boolean(context.state.isActualUserAdmin);
      const currentRoleMode = context.session?.roleMode;

      if (isPrivateChat) {
        await context.replyWithSelfDestructedHTML(context.t('role-private'));

        return;
      }

      if (isAnonymousAdmin) {
        await context.replyWithSelfDestructedHTML(context.t('role-anonymous-admin'));

        return;
      }

      if (!isActualUserAdmin) {
        await context.replyWithSelfDestructedHTML(context.t('settings-is-not-admin'));

        return;
      }

      if (!rawArgument) {
        if (currentRoleMode === USER_ROLE_MODE) {
          delete context.session.roleMode;
          context.state.isUserAdmin = true;

          await context.replyWithSelfDestructedHTML(context.t('role-changed-admin'));

          return;
        }

        context.session.roleMode = USER_ROLE_MODE;
        context.state.isUserAdmin = false;

        await context.replyWithSelfDestructedHTML(context.t('role-changed-user'));

        return;
      }

      if (!isSupportedRole(rawArgument)) {
        await context.replyWithSelfDestructedHTML(context.t('role-invalid'));

        return;
      }

      if (rawArgument === 'user') {
        context.session.roleMode = USER_ROLE_MODE;
        context.state.isUserAdmin = false;

        await context.replyWithSelfDestructedHTML(context.t('role-changed-user'));

        return;
      }

      delete context.session.roleMode;
      context.state.isUserAdmin = true;

      await context.replyWithSelfDestructedHTML(context.t('role-changed-admin'));
    };
  }
}

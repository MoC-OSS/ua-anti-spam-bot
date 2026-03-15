import type { GrammyContext } from '@app-types/context';

import { environmentConfig } from '../config';

export const getLinkToWebView = (context: GrammyContext) =>
  `${context.t('settings-link-to-web-view')}\n\n🔗 ${environmentConfig.WEB_VIEW_URL}`;

export const getHasNoLinkedChats = (context: GrammyContext) => context.t('settings-has-no-linked-chats');

export const getIsNotAdminMessage = (context: GrammyContext) => context.t('settings-is-not-admin');

import type { NextFunction } from 'grammy';
import type { GrammyContext } from 'types';

/**
 * @description
 * Add text into state
 * */
export function parseText(context: GrammyContext, next: NextFunction) {
  const text = context.msg?.text || context.msg?.caption || context.msg?.poll?.question;

  if (text) {
    context.state.text = text;
  }

  return next();
}

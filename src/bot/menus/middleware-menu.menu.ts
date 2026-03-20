import { Menu } from '@grammyjs/menu';

import type { GrammyMenuContext, GrammyMiddleware } from '@app-types/context';

/**
 * @description
 * Reimplementation of Grammy's menu to support menu-level middlewares.
 */
export class MiddlewareMenu<TContext extends GrammyMenuContext = GrammyMenuContext> extends Menu<TContext> {
  menuMiddlewares: GrammyMiddleware[] = [];

  addGlobalMiddlewares(...middlewares: GrammyMiddleware[]) {
    this.menuMiddlewares = middlewares;

    return this;
  }

  text(text: object | string, ...middleware: GrammyMiddleware[]) {
    const newMiddlewares = [...(this.menuMiddlewares || []), ...middleware];

    // @ts-ignore
    return this.add(typeof text === 'object' ? { ...text, middleware: newMiddlewares } : { text, middleware: newMiddlewares });
  }
}

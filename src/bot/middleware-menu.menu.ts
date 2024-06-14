import { Menu } from '@grammyjs/menu';

import type { GrammyMenuContext, GrammyMiddleware } from '../types';

/**
 * @description
 * Reimplementation of Grammy's menu to support menu-level middlewares.
 * */
export class MiddlewareMenu<C extends GrammyMenuContext = GrammyMenuContext> extends Menu<C> {
  menuMiddlewares: GrammyMiddleware[] = [];

  addGlobalMiddlewares(...middlewares: GrammyMiddleware[]) {
    this.menuMiddlewares = middlewares;
    return this;
  }

  text(text: string | object, ...middleware: GrammyMiddleware[]) {
    const newMiddlewares = [...(this.menuMiddlewares || []), ...middleware];

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    return this.add(typeof text === 'object' ? { ...text, middleware: newMiddlewares } : { text, middleware: newMiddlewares });
  }
}

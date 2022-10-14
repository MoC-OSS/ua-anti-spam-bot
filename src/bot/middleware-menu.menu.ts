import { Menu } from '@grammyjs/menu';
import { GrammyContext } from '../types';

/**
 * @description
 * Reimplementation of Grammy's menu to support menu-level middlewares.
 * */
 export class MiddlewareMenu<C extends GrammyContext> extends Menu<C> {
  /**
   * @param {MenuMiddleware<C>} middlewares
   * */

  addGlobalMiddlewares(...middlewares) {
    this.menuMiddlewares = middlewares;
    return this;
  }

  text(text, ...middleware) {
    const newMiddlewares = [...(this.menuMiddlewares || []), ...middleware];

    return this.add(typeof text === 'object' ? { ...text, middleware: newMiddlewares } : { text, middleware: newMiddlewares });
  }
}

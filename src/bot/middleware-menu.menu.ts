import { Menu } from '@grammyjs/menu';

/**
 * @description
 * Reimplementation of Grammy's menu to support menu-level middlewares.
 * */
class MiddlewareMenu extends Menu {
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

module.exports = {
  MiddlewareMenu,
};

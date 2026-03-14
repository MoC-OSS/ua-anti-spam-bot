import airbnbBase from 'eslint-config-airbnb-base';

import { compat } from '../eslint-compat.config.mjs';

/**
 * @description ESLint config for Node.js code. Applies Airbnb base style and disables class-methods-use-this rule.
 * @author Dmytro Vakulenko
 * @see https://github.com/airbnb/javascript
 */
export default [
  ...compat.config(airbnbBase),
  {
    name: 'airbnb-base - disable class-methods-use',
    rules: {
      'class-methods-use-this': 'off',
      'import/order': 'off',
      /**
       * This is Airbnb’s no-restricted-syntax text, written back when:
       *
       * - A lot of projects still supported IE11 / very old Chrome/Firefox/Safari.
       * - Babel transpiled for...of & generators to ES5.
       * - That required regenerator-runtime, which was relatively heavy.
       * */
      'no-restricted-syntax': 'off',
    },
  },
  {
    name: 'no-restricted-syntax - disallow labels and with statement',
    rules: {
      /**
       * Old airbnb config has for-of loop restriction.
       *
       * This was written for old browser targets where:
       *
       * - for...of and generators were transpiled by Babel, and
       * - Babel injected regenerator-runtime, which added weight to the bundle.
       *
       * Node 22 natively supports for...of completely including all modern evergreen browsers.
       *
       * If your TS target is modern enough (e.g. ES2020+), TypeScript just emits native for...of (or very lightweight helpers, not regenerator).
       *
       * You’re not shipping this to legacy browsers where regenerator-runtime is a concern.
       */
      'no-restricted-syntax': [
        'error',
        {
          selector: 'LabeledStatement',
          message: 'Labels are a form of GOTO; using them makes code confusing and hard to maintain and understand.',
        },
        {
          selector: 'WithStatement',
          message: '`with` is disallowed in strict mode because it makes code impossible to predict and optimize.',
        },
      ],
    },
  },
];

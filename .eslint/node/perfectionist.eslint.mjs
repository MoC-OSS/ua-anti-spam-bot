import perfectionist from 'eslint-plugin-perfectionist';

const defaultGroups = [
  'conditional', // (A extends B ? C : D)
  'function', // ((arg: T) => U)
  'import', // import('module').Type
  'intersection', // (A & B)
  'named', // SomeType
  'keyword', // any
  'literal', // 'literal' | 42 | true
  'object', // { a: string; b: number; }
  'operator', // keyof T
  'tuple', // [string, number]
  'union', // (A | B)
  'nullish', // null | undefined
];

const sortGroup = {
  customGroups: [
    { groupName: 'index', elementNamePattern: '^index$' },
    { groupName: 'path', elementNamePattern: '^path$' },
    { groupName: 'element', elementNamePattern: '^element$' },
    { groupName: 'key', elementNamePattern: '^key$' },
    { groupName: 'className', elementNamePattern: '^className$' },
    { groupName: 'classNames', elementNamePattern: '^classNames$' },
    { groupName: 'title', elementNamePattern: '^title$' },
    { groupName: 'message', elementNamePattern: '^message$' },
    { groupName: 'description', elementNamePattern: '^description$' },
  ],
  groups: ['index', 'path', 'element', 'key', 'className', 'classNames', 'title', 'message', 'description'],
};

/**
 * @description ESLint config for enforcing code sorting and organization using eslint-plugin-perfectionist. Applies recommended sorting rules for classes, imports, objects, etc.
 * @author Dmytro Vakulenko
 * @see https://github.com/azat-io/eslint-plugin-perfectionist
 */
export default [
  {
    name: 'perfectionist',
    ...perfectionist.configs['recommended-natural'],
    rules: {
      'perfectionist/sort-classes': 'off',
      'perfectionist/sort-named-imports': 'off',
      'perfectionist/sort-imports': 'off',
      'perfectionist/sort-interfaces': 'off',
      'perfectionist/sort-jsx-props': [
        'error',
        sortGroup,
        {
          type: 'natural',
        },
      ],
      'perfectionist/sort-modules': 'off',
      'perfectionist/sort-objects': 'off',
      'perfectionist/sort-union-types': [
        'error',
        {
          groups: defaultGroups,
          type: 'natural',
        },
      ],
    },
  },
];

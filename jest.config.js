/* eslint-disable unicorn/prefer-module */
/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
};

export default jestConfig;

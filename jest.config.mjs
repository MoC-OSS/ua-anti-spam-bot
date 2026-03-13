/* eslint-disable unicorn/prefer-module */
/** @type {import('ts-jest').JestConfigWithTsJest} */
const jestConfig = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['./src/jest-setup.ts'],
  transform: {
    '^.+\\.(t|j)sx?$': ['@swc/jest'],
  },
};

export default jestConfig;

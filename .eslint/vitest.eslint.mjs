import { defineConfig } from 'eslint/config';

import vitestEslint from './vitest/vitest.eslint.mjs';

export default defineConfig([...vitestEslint]);

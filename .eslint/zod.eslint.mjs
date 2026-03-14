import { defineConfig } from 'eslint/config';

import importZodEslint from './zod/import-zod.eslint.mjs';
import zodXEslint from './zod/zod-x.eslint.mjs';

export default defineConfig([...importZodEslint, ...zodXEslint]);

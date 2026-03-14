import { defineConfig } from 'eslint/config';
import importZod from 'eslint-plugin-import-zod';

export default defineConfig(...importZod.configs.recommended);

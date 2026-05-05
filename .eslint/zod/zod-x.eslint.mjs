import { defineConfig } from 'eslint/config';
import eslintPluginZod from 'eslint-plugin-zod';

export default defineConfig(eslintPluginZod.configs.recommended);

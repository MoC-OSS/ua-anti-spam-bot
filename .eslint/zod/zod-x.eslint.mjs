import { defineConfig } from 'eslint/config';
import eslintPluginZodX from 'eslint-plugin-zod-x';

export default defineConfig(eslintPluginZodX.configs.recommended);

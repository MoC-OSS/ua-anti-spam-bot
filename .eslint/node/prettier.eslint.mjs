import { defineConfig } from 'eslint/config';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

import 'eslint-config-prettier';

export default defineConfig([eslintPluginPrettierRecommended]);

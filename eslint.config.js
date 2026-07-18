import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['**/node_modules/', '**/dist/', '**/coverage/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // k6 scripts run in the k6 (goja) runtime, not Node; declare its globals.
    files: ['k6/**/*.js'],
    languageOptions: {
      globals: { __ENV: 'readonly', __VU: 'readonly', __ITER: 'readonly' },
    },
  },
  prettier,
);

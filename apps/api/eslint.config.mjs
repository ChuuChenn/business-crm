import base from '@crm/config/eslint/base';

export default [
  ...base,
  {
    rules: {
      // NestJS DI dựa vào emitDecoratorMetadata: import type trong constructor làm hỏng DI.
      '@typescript-eslint/consistent-type-imports': 'off',
      'no-console': 'off',
    },
  },
];

// 用于解决 https://github.com/eslint/eslint/issues/3458
require('@rushstack/eslint-config/patch/modern-module-resolution');

module.exports = {
  root: true,
  extends: ['@rushstack/eslint-config/mixins/react'],
  parserOptions: { tsconfigRootDir: __dirname }
};
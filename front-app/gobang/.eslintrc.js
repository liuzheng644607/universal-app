module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    'plugin:@typescript-eslint/recommended',
    'airbnb',
    'airbnb-typescript',
    'airbnb/hooks',
    'prettier',
  ],
  plugins: ['@typescript-eslint', 'prettier'],
  parserOptions: {
    tsconfigRootDir: __dirname,
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: true,
    project: ['./tsconfig.json'],
  },
  ignorePatterns: [".eslint*", "webpack/*"],
};

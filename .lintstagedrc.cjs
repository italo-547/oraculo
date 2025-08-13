export default {
  '*.{ts,js,cts,mts}': [
    'prettier --write',
    'eslint --fix'
  ],
  '*.{md,json}': [
    'prettier --write'
  ]
};

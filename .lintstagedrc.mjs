export default {
  'src/**/*.{ts,cts,mts,js}': ['prettier --write --ignore-unknown', 'eslint --fix'],
  'tests/**/*.{ts,js}': ['prettier --write --ignore-unknown', 'eslint --fix'],
  'scripts/**/*.{js,mjs,cjs,ts}': ['prettier --write --ignore-unknown', 'eslint --fix'],
  'docs/**/*.md': ['prettier --write --ignore-unknown'],
  '.github/**/*.{md,yml}': ['prettier --write --ignore-unknown'],
  './README.md': ['prettier --write --ignore-unknown'],
  './package.json': ['prettier --write --ignore-unknown'],
  './THIRD-PARTY-NOTICES.txt': ['prettier --write --ignore-unknown'],
};

const js = require('@eslint/js');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'readonly',
        global: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly'
      },
      ecmaVersion: 2022,
      sourceType: 'commonjs'
    },
    rules: {
      // Podstawowe reguły jakości kodu
      'no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_'
      }],
      'no-console': 'off', // Zezwalamy na console w backendzie
      'no-debugger': 'error',
      'no-alert': 'error',

      // Style i formatting
      'indent': ['error', 2],
      'quotes': ['error', 'single', { avoidEscape: true }],
      'semi': ['error', 'always'],
      'comma-dangle': ['error', 'never'],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',

      // Bezpieczeństwo
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'no-script-url': 'error',

      // Najlepsze praktyki
      'eqeqeq': ['error', 'always'],
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-arrow-callback': 'error',
      'arrow-spacing': 'error',
      'no-duplicate-imports': 'error',

      // Node.js specyficzne
      'no-path-concat': 'error',
      'no-process-exit': 'error',

      // Błędy które mogą powodować problemy
      'no-unreachable': 'error',
      'no-constant-condition': 'error',
      'no-dupe-keys': 'error',
      'no-empty': 'error',
      'valid-typeof': 'error'
    }
  },
  {
    // Specjalna konfiguracja dla testów
    files: ['tests/**/*.js', '**/*.test.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly',
        it: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': 'off' // W testach czasem nie używamy wszystkich zmiennych
    }
  },
  {
    // Utility scripts - zezwalamy na process.exit()
    files: ['healthcheck.js', 'prisma/seed-*.js'],
    rules: {
      'no-process-exit': 'off'
    }
  },
  {
    // Ignoruj node_modules i inne
    ignores: [
      'node_modules/**',
      'coverage/**',
      'generated/**',
      'uploads/**',
      'prisma/migrations/**'
    ]
  }
];

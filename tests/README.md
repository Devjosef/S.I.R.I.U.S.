# S.I.R.I.U.S. Tests

This directory contains test scripts for the S.I.R.I.U.S. project.

## Test Categories

### Core Features

- **`test-workers.js`**: Tests worker thread functionality
  - `npm run test:workers`: Standard test
  - `npm run test:workers:mobile`: Test with mobile device simulation
  - `npm run test:workers:disabled`: Test with worker threads disabled

- **`test-logger.js`**: Tests the Pino logging system
  - `npm run test:logger`: Test in development mode
  - `npm run test:logger:prod`: Test in production mode
  - `npm run test:logger:file`: Test with file-based logging

- **`test-memory.js`**: Tests the memory service
  - `npm run test:memory`: Standard test
  - `npm run test:memory:file`: Test with file-based logging

- **`test-matryoshka.js`**: Tests Matryoshka Quantization with model creation
  - `npm run test:matryoshka`: Standard test
  - `npm run test:matryoshka:mobile`: Test with mobile device simulation

- **`test-runtime-matryoshka.js`**: Tests Runtime Matryoshka Quantization
  - `npm run test:runtime-matryoshka`: Standard test
  - `npm run test:runtime-matryoshka:mobile`: Test with mobile device simulation

### Integration Tests

- **`test-ollama.js`**: Tests Ollama integration
  - `npm run test:ollama`

- **`test-voice.js`**: Tests voice interface functionality
  - `npm run test:voice`

- **`test-context.js`**: Tests context engine functionality
  - `npm run test:context`

- **`test-autonomous.js`**: Tests autonomous action engine
  - `npm run test:autonomous`

### API Tests

- **`test-public-apis.js`**: Tests integration with public APIs
  - `npm run test:public-apis`

- **`test-real-apis.js`**: Tests integration with real external APIs
  - `npm run test:real-apis`

### Phase Tests

- **`test-phase4.js`**: Tests Phase 4 functionality
  - `npm run test:phase4`

- **`test-neural-interface.js`**: Tests neural interface functionality
  - `npm run test:neural-interface`

- **`test-spiderman-web.js`**: Tests web integration functionality
  - `npm run test:spiderman-web`

## Running Tests

All tests can be run using npm scripts defined in `package.json`. For example:

```bash
# Run worker thread tests
npm run test:workers

# Run logger tests with file output
npm run test:logger:file

# Run memory tests
npm run test:memory

# Run Runtime Matryoshka Quantization tests
npm run test:runtime-matryoshka
```

## Adding New Tests

When adding new tests:

1. Place the test file in this directory with a descriptive name (e.g., `test-feature-name.js`)
2. Add a corresponding npm script in `package.json`
3. Document the test in this README

## Test Environment

Tests run in a Node.js environment with the following settings:

- `NODE_ENV`: Set to `development` or `production` depending on the test
- `IS_MOBILE`: Set to `true` for mobile simulation tests
- `MEMORY_LIMIT`: Set to simulate different memory constraints
- `CPU_CORES`: Set to simulate different CPU core counts

For more information on the testing approach, refer to the main [README.md](../README.md) in the project root directory. 
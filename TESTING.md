# Testing in 10xFlashCards

This document outlines the testing approach for the 10xFlashCards application.

## Unit Testing with Vitest

We use Vitest for unit and component testing with React Testing Library.

### Running Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Writing Unit Tests

- Place test files next to the files they test with the `.test.ts` or `.test.tsx` extension
- Use the React Testing Library for testing React components
- Follow the Arrange-Act-Assert pattern in tests
- Mock Supabase clients using the factory pattern provided in the setup file

## End-to-End Testing with Playwright

We use Playwright for E2E testing with the Page Object Model pattern.

### Running E2E Tests

```bash
# Run all E2E tests
npm run e2e

# Run tests with UI mode
npm run e2e:ui

# Run tests in debug mode
npm run e2e:debug

# Generate tests with Codegen
npm run e2e:codegen
```

### Writing E2E Tests

- Place page objects in `tests/pages/` directory
- Use descriptive test and assertion names
- Implement visual testing with screenshots
- Use the Page Object Model pattern for maintainable tests

## Testing Guidelines

1. **Test Isolation**: Each test should be independent and not rely on the state created by another test
2. **Meaningful Assertions**: Write assertions that verify the behavior, not the implementation
3. **Realistic Data**: Use realistic test data that represents what users will encounter
4. **Error Handling**: Test both success and error cases
5. **Performance**: Keep tests fast to ensure quick feedback during development

# Testing Best Practices Guide

## Overview
This guide outlines best practices for writing tests in the Coop Commerce Web platform.

## Table of Contents
1. [Test Structure](#test-structure)
2. [Writing Good Tests](#writing-good-tests)
3. [Mocking Strategies](#mocking-strategies)
4. [Common Patterns](#common-patterns)
5. [Performance](#performance)
6. [Debugging](#debugging)

## Test Structure

### File Organization
```
__tests__/
├── unit/          # Unit tests for utilities and services
├── components/    # Component tests
├── integration/   # Integration and e2e tests
├── utils/         # Test utilities and helpers
└── mocks/         # Mock data and API mocks
```

### Test File Naming
- Component tests: `ComponentName.test.tsx`
- Utility tests: `utilityName.test.ts`
- Integration tests: `featureName.integration.test.ts`
- E2E tests: `featureName.e2e.test.ts`

### Test Suite Structure
```typescript
describe('Feature Name', () => {
  // Setup
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // Test cases
  test('should do something', () => {
    // Arrange
    // Act
    // Assert
  })

  // Cleanup
  afterEach(() => {
    // cleanup
  })
})
```

## Writing Good Tests

### AAA Pattern (Arrange-Act-Assert)
```typescript
test('should add product to cart', async () => {
  // ARRANGE - Set up test data
  const product = mockProduct
  const user = mockUser

  // ACT - Perform the action
  const cart = await addToCart(user.uid, product.id)

  // ASSERT - Verify the result
  expect(cart.items).toContainEqual(expect.objectContaining({
    productId: product.id
  }))
})
```

### Test Naming
- Start with "should" or "returns"
- Be specific about what you're testing
- Avoid vague names

✅ Good:
- `should add product to cart when item is available`
- `should return error when cart is empty`
- `should calculate total with tax and shipping`

❌ Bad:
- `test cart`
- `should work`
- `test add`

### Test Size
- Unit tests: 2-5 lines of code
- Integration tests: 5-15 lines of code
- E2E tests: 10-20 lines of code

If a test is getting large, split it into multiple smaller tests.

### Assertions
- Use specific assertions
- Test one thing per test
- Use `expect()` multiple times if needed

✅ Good:
```typescript
test('should validate email format', () => {
  expect(isValidEmail('test@example.com')).toBe(true)
  expect(isValidEmail('invalid.email')).toBe(false)
  expect(isValidEmail('user+tag@domain.co.uk')).toBe(true)
})
```

❌ Bad:
```typescript
test('should validate everything', () => {
  expect(isValidEmail('test@example.com')).toBe(true)
  expect(isValidPassword('StrongPass123!')).toBe(true)
  expect(isValidPhone('08012345678')).toBe(true)
})
```

## Mocking Strategies

### Mocking Modules
```typescript
// Mock entire module
jest.mock('../lib/auth/authContext', () => ({
  useAuth: jest.fn(),
}))

// Mock specific functions
jest.mock('../lib/firebase/firestore', () => ({
  getProducts: jest.fn(),
  searchProducts: jest.fn(),
}))
```

### Manual Mocks
```typescript
const mockGetProducts = jest.fn()
  .mockResolvedValue([mockProduct])

// Or with different responses
mockGetProducts
  .mockResolvedValueOnce([mockProduct])      // First call
  .mockRejectedValueOnce(new Error('Failed')) // Second call
  .mockResolvedValueOnce([])                  // Third call
```

### Mock Data
Use factory functions instead of shared objects:

✅ Good:
```typescript
function createMockProduct(overrides = {}) {
  return {
    id: 'prod-001',
    name: 'Test Product',
    ...overrides,
  }
}

test('should work', () => {
  const product = createMockProduct({ name: 'Custom Name' })
})
```

❌ Bad:
```typescript
const mockProduct = { id: 'prod-001', name: 'Test Product' }

test('should work', () => {
  // Modifying shared mock
  mockProduct.name = 'Custom Name'
})
```

### Mocking Async Operations
```typescript
test('should fetch products', async () => {
  const mockFetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [mockProduct],
  })

  global.fetch = mockFetch

  const products = await getProducts()

  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/products')
  )
  expect(products).toHaveLength(1)
})
```

## Common Patterns

### Testing API Calls
```typescript
test('should call API with correct parameters', async () => {
  const mockAPI = jest.fn().mockResolvedValue(mockProduct)
  
  await getProduct('prod-001', mockAPI)

  expect(mockAPI).toHaveBeenCalledWith('prod-001')
})
```

### Testing Error Cases
```typescript
test('should handle API errors gracefully', async () => {
  jest.mock('/lib/api', () => ({
    getProduct: jest.fn()
      .mockRejectedValue(new Error('Network error'))
  }))

  await expect(getProduct('prod-001')).rejects.toThrow('Network error')
})
```

### Testing User Interactions
```typescript
import userEvent from '@testing-library/user-event'

test('should handle form submission', async () => {
  const user = userEvent.setup()
  const handleSubmit = jest.fn()

  render(<LoginForm onSubmit={handleSubmit} />)

  const emailInput = screen.getByLabelText(/email/i)
  const submitButton = screen.getByRole('button', { name: /login/i })

  await user.type(emailInput, 'test@example.com')
  await user.click(submitButton)

  expect(handleSubmit).toHaveBeenCalledWith(
    expect.objectContaining({ email: 'test@example.com' })
  )
})
```

### Testing Async Updates
```typescript
test('should update UI after loading', async () => {
  jest.mock('/lib/api', () => ({
    getProducts: jest.fn()
      .mockResolvedValue([mockProduct])
  }))

  render(<ProductList />)

  expect(screen.getByText(/loading/i)).toBeInTheDocument()

  await waitFor(() => {
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
  })
})
```

### Testing Context/Redux
```typescript
test('should render with context value', () => {
  const mockContextValue = { user: mockUser }

  render(
    <AuthContext.Provider value={mockContextValue}>
      <Component />
    </AuthContext.Provider>
  )

  expect(screen.getByText(mockUser.email)).toBeInTheDocument()
})
```

## Performance

### Test Timeouts
Set appropriate timeouts for different test types:
```typescript
jest.setTimeout(5000)  // 5 seconds for integration tests
jest.setTimeout(1000)  // 1 second for unit tests
jest.setTimeout(30000) // 30 seconds for e2e tests
```

### Parallel Test Execution
Tests run in parallel by default. Ensure:
- Tests don't share state
- Mock data is isolated per test
- Use `beforeEach` and `afterEach` for setup/cleanup

### Skipping and Focusing Tests
```typescript
// Run only this test
test.only('should work', () => {})

// Skip this test
test.skip('should work', () => {})

// Run only tests matching pattern
describe.only('Auth', () => {})
```

## Debugging

### Debug Output
```typescript
import { render, screen } from '@testing-library/react'

test('should debug', () => {
  const { debug } = render(<Component />)
  
  // Print DOM to console
  debug()
  
  // Or specific element
  debug(screen.getByRole('button'))
})
```

### Logging in Tests
```typescript
test('should log interactions', async () => {
  const user = userEvent.setup()
  const component = render(<Component />)

  console.log('Before click')
  await user.click(screen.getByRole('button'))
  console.log('After click')
})
```

### VS Code Debug Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

### Debugging Tips
1. Use `screen.debug()` to see current DOM
2. Use `screen.logTestingPlaygroundURL()` for testing playground
3. Add `console.log()` statements
4. Use VS Code debugger with breakpoints
5. Run single test with `test.only()`

## Running Tests

### All Tests
```bash
npm test
```

### Specific File
```bash
npm test -- CartScreen.test.tsx
```

### Specific Suite
```bash
npm test -- --testNamePattern="Cart"
```

### Watch Mode
```bash
npm test -- --watch
```

### Coverage Report
```bash
npm test -- --coverage
```

### Update Snapshots
```bash
npm test -- --updateSnapshot
```

## Coverage Goals
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 80%+
- **Lines**: 80%+

## Common Issues and Solutions

### Issue: Mock not working
```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})
```

### Issue: Async tests timing out
```typescript
// Increase timeout for slow operations
test('should fetch data', async () => {
  // test code
}, 5000) // 5 second timeout
```

### Issue: State not updating in tests
```typescript
// Wrap in act() or use waitFor()
await waitFor(() => {
  expect(element).toBeInTheDocument()
})
```

### Issue: Module not found errors
```typescript
// Use moduleNameMapper in jest.config.js
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

## Resources
- [Testing Library Docs](https://testing-library.com/)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

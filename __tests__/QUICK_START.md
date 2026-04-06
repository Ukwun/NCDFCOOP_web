# Testing Quick Start Guide

## Setup
Tests are configured and ready to run. No additional setup needed!

## Quick Commands

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test -- --watch
```

### Run Tests with Coverage
```bash
npm test -- --coverage
```

### Run Specific Test File
```bash
npm test -- CartScreen.test.tsx
```

### Run Tests Matching Pattern
```bash
npm test -- --testNamePattern="Cart"
```

### Update Snapshots
```bash
npm test -- --updateSnapshot
```

## First Test

Create a simple test file:

```typescript
// __tests__/example.test.ts
describe('Example Test', () => {
  test('should pass', () => {
    expect(1 + 1).toBe(2)
  })
})
```

Run it:
```bash
npm test -- example.test.ts
```

## Test Templates

### Component Test
```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  test('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Expected text')).toBeInTheDocument()
  })

  test('should handle user interaction', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    await user.click(screen.getByRole('button'))
    
    expect(screen.getByText('Updated text')).toBeInTheDocument()
  })
})
```

### Service Test
```typescript
import { getProducts } from '@/lib/api'

jest.mock('@/lib/api')

describe('getProducts', () => {
  test('should fetch products', async () => {
    const mockProducts = [{ id: '1', name: 'Product' }]
    jest.mocked(getProducts).mockResolvedValue(mockProducts)

    const result = await getProducts()

    expect(result).toEqual(mockProducts)
  })
})
```

### Utility Test
```typescript
import { formatPrice } from '@/lib/utils/format'

describe('formatPrice', () => {
  test('should format price correctly', () => {
    expect(formatPrice(5000)).toBe('₦5,000')
  })

  test('should handle zero', () => {
    expect(formatPrice(0)).toBe('₦0')
  })
})
```

## Project Structure

```
__tests__/
├── components/           # Component tests
│   ├── HomeScreen.test.tsx
│   ├── CartScreen.test.tsx
│   └── examples.test.tsx
├── integration/          # Integration tests
│   ├── auth.integration.test.ts
│   ├── shopping.integration.test.ts
│   └── examples.integration.test.ts
├── unit/                # Unit tests
│   ├── utils.test.ts
│   ├── services.test.ts
│   └── examples.unit.test.ts
├── mocks/               # Mock data
│   ├── mockData.ts
│   ├── mockFirebase.ts
│   └── mockAPI.ts
├── utils/               # Test helpers
│   └── testUtils.ts
├── setup.ts            # Test setup file
├── jest.config.js      # Jest configuration
└── TESTING_BEST_PRACTICES.md
```

## Common Patterns

### Mock Data
```typescript
import { mockUser, mockProduct, mockCart } from '@/__tests__/utils/testUtils'

test('should work', () => {
  // Use mock data
  const user = mockUser
  const product = mockProduct
})
```

### User Interactions
```typescript
import userEvent from '@testing-library/user-event'

test('should handle click', async () => {
  const user = userEvent.setup()
  render(<Button />)
  
  await user.click(screen.getByRole('button'))
})
```

### Async Operations
```typescript
import { waitFor } from '@testing-library/react'

test('should load data', async () => {
  render(<DataComponent />)
  
  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })
})
```

### Module Mocking
```typescript
jest.mock('@/lib/auth', () => ({
  useAuth: jest.fn(() => ({ user: mockUser }))
}))

test('should use auth', () => {
  render(<AuthComponent />)
  expect(screen.getByText(mockUser.email)).toBeInTheDocument()
})
```

## Debugging Tests

### View Current DOM
```typescript
test('debug', () => {
  const { debug } = render(<Component />)
  debug() // Prints DOM to console
})
```

### Run Single Test
```bash
npm test -- --testNamePattern="exact test name"
```

### Run Tests in Band (Sequential)
```bash
npm test -- --runInBand
```

### Use VS Code Debugger
1. Open test file
2. Click Debug Test link (if available)
3. Or set breakpoints and run tests

### View Testing Playground
```typescript
import { screen } from '@testing-library/react'

test('use playground', () => {
  render(<Component />)
  screen.logTestingPlaygroundURL()
})
```

## Next Steps

1. **Read the Best Practices Guide**: [TESTING_BEST_PRACTICES.md](./TESTING_BEST_PRACTICES.md)
2. **Review Examples**: Check `__tests__/unit/examples.unit.test.ts`
3. **Write Your First Test**: Create a simple component test
4. **Run Coverage Report**: `npm test -- --coverage`

## Coverage Report

After running tests with coverage:
```bash
npm test -- --coverage
```

View results in `coverage/lcov-report/index.html`

### Coverage Goals
- Statements: 80%+
- Branches: 75%+  
- Functions: 80%+
- Lines: 80%+

## Tips & Tricks

### Test Naming
Good test names describe what should happen:
```typescript
✅ test('should add product to cart when user clicks add button')
❌ test('cart test')
```

### Keep Tests Simple
```typescript
✅ One assertion per test
   test('should format price with currency', () => {
     expect(formatPrice(5000)).toBe('₦5,000')
   })

❌ Multiple concerns in one test
   test('should work', () => {
     expect(formatPrice(5000)).toBe('₦5,000')
     expect(calculateTax(5000)).toBe(375)
     expect(validateEmail('test@example.com')).toBe(true)
   })
```

### Use Factories for Mock Data
```typescript
✅ Create data on demand with variations
   function createMockProduct(overrides = {}) {
     return { id: '1', name: 'Product', ...overrides }
   }

❌ Reuse the same object
   const mockProduct = { id: '1', name: 'Product' }
```

### Test Behavior, Not Implementation
```typescript
✅ Test what the user sees
   expect(screen.getByRole('button')).toBeInTheDocument()

❌ Test internal state
   expect(component.state.isVisible).toBe(true)
```

## Troubleshooting

### Tests Won't Run
```bash
# Ensure dependencies are installed
npm install

# Clear cache
npm test -- --clearCache

# Run with verbose output
npm test -- --verbose
```

### Mock Not Working
```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks()
})

// Or use jest.resetModules()
beforeEach(() => {
  jest.resetModules()
})
```

### Async Tests Timeout
```typescript
// Increase timeout
test('async test', async () => {
  // test code
}, 10000) // 10 seconds
```

### Module Import Errors
Check `jest.config.js` for:
- `moduleNameMapper` for path aliases
- `testEnvironment` is set to 'jsdom'
- `setupFilesAfterEnv` is configured

## Further Reading

- [Testing Library Documentation](https://testing-library.com/)
- [Jest Documentation](https://jestjs.io/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing React Components](https://kentcdodds.com/blog/testing-react-components)

## Need Help?

1. Check the examples in `__tests__/unit/examples.unit.test.ts`
2. Review `TESTING_BEST_PRACTICES.md` for detailed patterns
3. Look at existing tests in the `__tests__` folder
4. Check the Jest documentation for your specific issue

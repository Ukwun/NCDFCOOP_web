# Testing Documentation Index

Complete guide to all testing resources for the Coop Commerce Web platform.

## 📚 Documentation Files

### Quick Reference
- **[QUICK_START.md](./QUICK_START.md)** - Start here! Quick commands and templates
- **[TESTING_BEST_PRACTICES.md](./TESTING_BEST_PRACTICES.md)** - Comprehensive best practices guide

## 🏗️ Project Setup Files

### Configuration
- **[jest.config.js](../jest.config.js)** - Jest configuration with all settings
- **[setup.ts](./__tests__/setup.ts)** - Test environment setup and global mocks

### Package Scripts
```json
{
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand"
}
```

## 📁 Test Structure

```
__tests__/
├── setup.ts                           # Global setup and teardown
├── jest.config.js                     # Jest configuration
├── QUICK_START.md                    # Quick reference guide
├── TESTING_BEST_PRACTICES.md         # Best practices documentation
├── TESTING_INDEX.md                  # This file
│
├── utils/
│   └── testUtils.ts                  # Shared test utilities
│       ├── Mock data generators (mockUser, mockProduct, etc.)
│       ├── Custom render function
│       ├── Test helpers (waitForElement, mockApiResponse)
│
├── mocks/
│   ├── mockData.ts                   # Mock data factory functions
│   ├── mockFirebase.ts               # Firebase mock setup
│   ├── mockAPI.ts                    # API mock responses
│   └── mockAuth.ts                   # Auth mock setup
│
├── unit/
│   ├── examples.unit.test.ts         # Example unit tests
│   ├── utils.test.ts                 # Utility function tests
│   ├── services.test.ts              # Service function tests
│   ├── validations.test.ts           # Validation function tests
│   └── formatters.test.ts            # Formatter function tests
│
├── components/
│   ├── examples.test.tsx             # Example component tests
│   ├── HomeScreen.test.tsx           # HomeScreen component test
│   ├── CartScreen.test.tsx           # CartScreen component test
│   ├── LoginScreen.test.tsx          # LoginScreen component test
│   ├── Navigation.test.tsx           # Navigation component test
│   └── [ComponentName].test.tsx      # Add component tests here
│
└── integration/
    ├── examples.integration.test.ts  # Example integration tests
    ├── auth.integration.test.ts      # Authentication flow tests
    ├── shopping.integration.test.ts  # Shopping flow tests
    ├── seller.integration.test.ts    # Seller flow tests
    ├── payment.integration.test.ts   # Payment flow tests
    ├── notifications.integration.test.ts # Notification tests
    └── [FeatureName].integration.test.ts # Add integration tests here
```

## 🧪 Test Types

### Unit Tests
Test individual functions and utilities in isolation.

**Location**: `__tests__/unit/`

**Example Pattern**:
```typescript
describe('formatPrice', () => {
  test('should format price with currency', () => {
    expect(formatPrice(5000)).toBe('₦5,000')
  })
})
```

**What to Test**:
- Utility functions
- Service methods
- Validation functions
- Data transformations
- Error handling

### Component Tests
Test React components with user interactions.

**Location**: `__tests__/components/`

**Example Pattern**:
```typescript
describe('CartScreen', () => {
  test('should render cart items', () => {
    render(<CartScreen />)
    expect(screen.getByText('Items in Cart')).toBeInTheDocument()
  })
})
```

**What to Test**:
- Component rendering
- User interactions (clicks, inputs)
- Props handling
- State changes
- Conditional rendering

### Integration Tests
Test complete features and user workflows.

**Location**: `__tests__/integration/`

**Example Pattern**:
```typescript
describe('Shopping Flow', () => {
  test('user adds product to cart and checks out', async () => {
    // Complete workflow test
  })
})
```

**What to Test**:
- User authentication flows
- Shopping workflows
- Payment processing
- Order management
- Multi-step processes

### E2E Tests
Test complete user journeys (typically with Cypress/Playwright).

**Documentation**: See integration tests for patterns

**What to Test**:
- Complete user workflows from start to finish
- Navigation between pages
- Form submissions and validations
- API interactions

## 🛠️ Test Tools & Utilities

### Available Test Utilities
See [utils/testUtils.ts](./utils/testUtils.ts):

```typescript
// Mock data generators
mockUser, mockProduct, mockOrder, mockCart

// Custom render function
render()

// Test helpers
waitForElement()
mockApiResponse()
```

### Testing Libraries
- **@testing-library/react** - Render components and query DOM
- **@testing-library/user-event** - Simulate user interactions
- **jest** - Test runner and assertions
- **jest-mock-extended** - Enhanced mocking utilities

### Usage Examples
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { mockUser, mockProduct } from '@/__tests__/utils/testUtils'
```

## 🎯 Coverage Goals

| Metric | Target |
|--------|--------|
| Statements | 80%+ |
| Branches | 75%+ |
| Functions | 80%+ |
| Lines | 80%+ |

### Generate Coverage Report
```bash
npm test -- --coverage
```

View detailed report in `coverage/lcov-report/index.html`

## 📋 Common Test Patterns

### Pattern 1: Testing User Input
```typescript
test('should validate email on submit', async () => {
  const user = userEvent.setup()
  render(<LoginForm />)
  
  const input = screen.getByLabelText(/email/i)
  await user.type(input, 'invalid')
  
  expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
})
```

### Pattern 2: Testing Async Operations
```typescript
test('should load products', async () => {
  render(<ProductList />)
  
  expect(screen.getByText(/loading/i)).toBeInTheDocument()
  
  await waitFor(() => {
    expect(screen.getByText('Product 1')).toBeInTheDocument()
  })
})
```

### Pattern 3: Testing Mocked Services
```typescript
jest.mock('@/lib/api', () => ({
  getProducts: jest.fn()
}))

test('should fetch products from API', async () => {
  jest.mocked(getProducts).mockResolvedValue([mockProduct])
  
  const products = await getProducts()
  
  expect(products).toHaveLength(1)
})
```

### Pattern 4: Testing Events
```typescript
test('should handle button click', async () => {
  const handleClick = jest.fn()
  render(<Button onClick={handleClick} />)
  
  fireEvent.click(screen.getByRole('button'))
  
  expect(handleClick).toHaveBeenCalled()
})
```

## 🚀 Running Tests

### Basic Commands
```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run specific file
npm test -- CartScreen.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="Cart"
```

### Advanced Commands
```bash
# Clear test cache
npm test -- --clearCache

# Run in band (sequential)
npm test -- --runInBand

# Update snapshots
npm test -- --updateSnapshot

# Show verbose output
npm test -- --verbose

# Debug tests
npm test -- --debug
```

## 🐛 Debugging Tips

### 1. View DOM State
```typescript
const { debug } = render(<Component />)
debug() // Prints current DOM
```

### 2. Check Element Queries
```typescript
screen.logTestingPlaygroundURL() // Opens testing playground
```

### 3. Debug User Interactions
```typescript
const user = userEvent.setup({ delay: null }) // No delay
```

### 4. VS Code Debugging
- Add breakpoint in test
- Click "Debug Test" link (if available)
- Or use: `npm test -- --debug`

### 5. Inspect Mock Calls
```typescript
expect(mockFn).toHaveBeenCalledWith(expectedArg)
expect(mockFn).toHaveBeenCalledTimes(1)
console.log(mockFn.mock.calls) // All calls
```

## ⚠️ Common Issues & Solutions

### Issue: Tests Pass Locally but Fail in CI
**Solution**: 
- Clear cache: `npm test -- --clearCache`
- Use `--runInBand` flag in CI
- Check for timing issues

### Issue: Async Tests Timeout
**Solution**:
```typescript
test('async test', async () => {
  // test code
}, 10000) // Increase timeout
```

### Issue: Mock Not Working
**Solution**:
```typescript
beforeEach(() => {
  jest.clearAllMocks()
  jest.resetModules()
})
```

### Issue: Component Not Re-rendering
**Solution**: Use `waitFor()` for async updates
```typescript
await waitFor(() => {
  expect(element).toBeInTheDocument()
})
```

## 📚 Additional Resources

### Documentation
- [Jest Documentation](https://jestjs.io/)
- [Testing Library Docs](https://testing-library.com/)
- [React Testing Library API](https://testing-library.com/docs/react-testing-library/intro/)

### Best Practices
- [Kent C. Dodds - Testing React](https://kentcdodds.com/blog/testing-react-components)
- [Common Testing Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Best Practices Guide](./TESTING_BEST_PRACTICES.md)

### Tools
- [Testing Playground](https://testing-playground.com/) - Debug test queries
- [Coverage Viewer](./coverage/lcov-report/index.html) - View coverage report
- [Jest VS Code Extension](https://marketplace.visualstudio.com/items?itemName=jest-community.jest-runner)

## 📝 Checklist for Writing Tests

- [ ] Test name describes what should happen
- [ ] Test follows AAA pattern (Arrange-Act-Assert)
- [ ] Uses proper mock data from testUtils
- [ ] Tests behavior, not implementation
- [ ] Tests are isolated and don't share state
- [ ] Async operations use waitFor or act
- [ ] Mocks are cleared in beforeEach
- [ ] No console errors or warnings
- [ ] Coverage goals are met
- [ ] Test passes locally and in CI/CD

## 🎓 Getting Started

1. **Read**: [QUICK_START.md](./QUICK_START.md)
2. **Review**: [TESTING_BEST_PRACTICES.md](./TESTING_BEST_PRACTICES.md)
3. **Study**: Example tests in each folder
4. **Write**: Your first test using provided templates
5. **Run**: `npm test` and verify it passes
6. **Repeat**: Write more tests for your components

## 📞 Need Help?

1. Check examples in the `__tests__` folder
2. Review relevant section in TESTING_BEST_PRACTICES.md
3. Search Jest or Testing Library documentation
4. Ask in team Slack/Discord

---

**Last Updated**: 2024
**Version**: 1.0
**Maintained By**: Development Team

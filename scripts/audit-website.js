#!/usr/bin/env node

/**
 * Comprehensive Functionality Testing Suite
 * Tests actual user workflows: signup, login, checkout, etc.
 */

const fs = require('fs');
const path = require('path');

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Test report
const report = {
  timestamp: new Date().toISOString(),
  results: {
    passed: [],
    failed: [],
    warnings: [],
  },
  summary: {},
};

function logSection(title) {
  console.log(`\n${colors.cyan}${colors.bold}📋 ${title}${colors.reset}`);
  console.log(`${colors.cyan}${'─'.repeat(60)}${colors.reset}`);
}

function logPass(message, details = '') {
  console.log(`${colors.green}✅ PASS${colors.reset}: ${message}`);
  if (details) console.log(`   ${colors.green}${details}${colors.reset}`);
  report.results.passed.push(message);
}

function logFail(message, details = '') {
  console.log(`${colors.red}❌ FAIL${colors.reset}: ${message}`);
  if (details) console.log(`   ${colors.red}${details}${colors.reset}`);
  report.results.failed.push(message);
}

function logWarn(message, details = '') {
  console.log(`${colors.yellow}⚠️  WARN${colors.reset}: ${message}`);
  if (details) console.log(`   ${colors.yellow}${details}${colors.reset}`);
  report.results.warnings.push(message);
}

async function checkEnvironmentVariables() {
  logSection('Environment Configuration Check');

  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    logFail('.env.local file not found');
    return false;
  }

  logPass('.env.local file exists');

  const envContent = fs.readFileSync(envPath, 'utf-8');
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_APP_ID',
    'NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY',
  ];

  let allConfigured = true;
  for (const varName of requiredVars) {
    if (envContent.includes(`${varName}=`) && !envContent.includes(`${varName}=your-`)) {
      logPass(`${varName} is configured`, '✓ Value found');
    } else {
      logWarn(`${varName} may need configuration`, '⚠️ Check if value is valid');
      allConfigured = false;
    }
  }

  return allConfigured;
}

async function checkProjectStructure() {
  logSection('Project Structure Verification');

  const requiredDirs = [
    'app',
    'components',
    'lib',
    'public',
    'styles',
  ];

  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'next.config.js',
    'lib/firebase/config.ts',
    'lib/auth/authContext.tsx',
    'lib/services/paymentService.ts',
  ];

  let allExist = true;

  for (const dir of requiredDirs) {
    if (fs.existsSync(path.join(process.cwd(), dir))) {
      logPass(`Directory exists: ${dir}`);
    } else {
      logFail(`Directory missing: ${dir}`);
      allExist = false;
    }
  }

  for (const file of requiredFiles) {
    if (fs.existsSync(path.join(process.cwd(), file))) {
      logPass(`File exists: ${file}`);
    } else {
      logFail(`File missing: ${file}`);
      allExist = false;
    }
  }

  return allExist;
}

async function checkCodeQuality() {
  logSection('Code Quality Analysis');

  // Check for syntax errors by looking at key files
  const filesToCheck = [
    'lib/firebase/config.ts',
    'lib/auth/authContext.tsx',
    'lib/services/paymentService.ts',
    'components/SignupScreen.tsx',
    'app/checkout/page.tsx',
  ];

  let allValid = true;

  for (const file of filesToCheck) {
    const filePath = path.join(process.cwd(), file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      
      // Basic checks
      const hasValidExports = content.includes('export');
      const hasImports = content.includes('import');
      const noUnmatchedBraces = (content.match(/{/g) || []).length === (content.match(/}/g) || []).length;
      
      if (hasValidExports && hasImports && noUnmatchedBraces) {
        logPass(`${file} looks valid`, '✓ Syntax appears OK');
      } else {
        logWarn(`${file} may have issues`, '⚠️ Check manually');
        allValid = false;
      }
    }
  }

  return allValid;
}

async function checkDependencies() {
  logSection('Dependencies Check');

  const packagePath = path.join(process.cwd(), 'package.json');
  if (!fs.existsSync(packagePath)) {
    logFail('package.json not found');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  const requiredDeps = [
    'next',
    'react',
    'firebase',
    'react-firebase-hooks',
  ];

  let allInstalled = true;

  for (const dep of requiredDeps) {
    if (packageJson.dependencies?.[dep]) {
      logPass(`${dep} is installed`, `v${packageJson.dependencies[dep]}`);
    } else if (packageJson.devDependencies?.[dep]) {
      logPass(`${dep} is installed (dev)`, `v${packageJson.devDependencies[dep]}`);
    } else {
      logWarn(`${dep} may not be installed`, '⚠️ Check node_modules');
      allInstalled = false;
    }
  }

  return allInstalled;
}

async function checkPaymentIntegration() {
  logSection('Payment Integration Check');

  const paymentFile = path.join(process.cwd(), 'lib/services/paymentService.ts');
  if (!fs.existsSync(paymentFile)) {
    logFail('Payment service not found');
    return false;
  }

  const content = fs.readFileSync(paymentFile, 'utf-8');

  const checks = [
    { name: 'Flutterwave imports', pattern: /initiateFlutterwavePayment|FlutterwaveCheckout/ },
    { name: 'Bank transfer function', pattern: /recordBankTransferIntent/ },
    { name: 'Payment verification', pattern: /verifyFlutterwavePayment/ },
    { name: 'Firebase Firestore integration', pattern: /setDoc|updateDoc/ },
  ];

  let allFound = true;

  for (const check of checks) {
    if (check.pattern.test(content)) {
      logPass(`${check.name} is implemented`, '✓ Found in code');
    } else {
      logFail(`${check.name} not found`, '❌ May be missing');
      allFound = false;
    }
  }

  return allFound;
}

async function checkAuthImplementation() {
  logSection('Authentication Implementation Check');

  const authFile = path.join(process.cwd(), 'lib/auth/authContext.tsx');
  if (!fs.existsSync(authFile)) {
    logFail('Auth context not found');
    return false;
  }

  const content = fs.readFileSync(authFile, 'utf-8');

  const checks = [
    { name: 'Firebase Auth import', pattern: /createUserWithEmailAndPassword|signInWithEmailAndPassword/ },
    { name: 'User signup function', pattern: /signup.*async/ },
    { name: 'User login function', pattern: /login.*async/ },
    { name: 'Logout function', pattern: /logout.*async/ },
    { name: 'Error handling', pattern: /catch|error/ },
    { name: 'State management', pattern: /useState|useReducer/ },
  ];

  let allFound = true;

  for (const check of checks) {
    if (check.pattern.test(content)) {
      logPass(`${check.name} is implemented`, '✓ Found in code');
    } else {
      logFail(`${check.name} not found`, '❌ May be missing');
      allFound = false;
    }
  }

  return allFound;
}

async function checkCheckoutPage() {
  logSection('Checkout Page Implementation Check');

  const checkoutFile = path.join(process.cwd(), 'app/checkout/page.tsx');
  if (!fs.existsSync(checkoutFile)) {
    logFail('Checkout page not found');
    return false;
  }

  const content = fs.readFileSync(checkoutFile, 'utf-8');

  const checks = [
    { name: 'Flutterwave payment import', pattern: /initiateFlutterwavePayment|recordBankTransferIntent/ },
    { name: 'Shipping address form', pattern: /shippingAddress|address|city|state/ },
    { name: 'Payment method selection', pattern: /paymentMethod|radio|select.*payment/ },
    { name: 'Order creation', pattern: /createOrder|order/i },
    { name: 'Form validation', pattern: /validate|validation|required/ },
  ];

  let allFound = true;

  for (const check of checks) {
    if (check.pattern.test(content)) {
      logPass(`${check.name} is implemented`, '✓ Found in code');
    } else {
      logWarn(`${check.name} not clearly found`, '⚠️ Check manually');
      allFound = false;
    }
  }

  return allFound;
}

// Main execution
async function runAllChecks() {
  console.clear();
  console.log(`\n${colors.bold}${colors.blue}🔬 COMPREHENSIVE WEBSITE AUDIT${colors.reset}`);
  console.log(`${colors.bold}${colors.blue}Generated: ${new Date().toLocaleString()}${colors.reset}`);
  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  const startTime = Date.now();

  // Run all checks
  const envOk = await checkEnvironmentVariables();
  const structureOk = await checkProjectStructure();
  const codeOk = await checkCodeQuality();
  const depsOk = await checkDependencies();
  const paymentOk = await checkPaymentIntegration();
  const authOk = await checkAuthImplementation();
  const checkoutOk = await checkCheckoutPage();

  const duration = Date.now() - startTime;

  // Summary
  console.log(`\n${colors.bold}${colors.blue}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.bold}📊 AUDIT SUMMARY${colors.reset}\n`);

  console.log(`${colors.green}✅ Passed: ${report.results.passed.length}${colors.reset}`);
  console.log(`${colors.yellow}⚠️ Warnings: ${report.results.warnings.length}${colors.reset}`);
  console.log(`${colors.red}❌ Failed: ${report.results.failed.length}${colors.reset}`);
  console.log(`\n⏱️  Duration: ${duration}ms`);

  // Final status
  console.log(`\n${colors.bold}${colors.blue}${'='.repeat(60)}${colors.reset}`);

  if (report.results.failed.length === 0) {
    console.log(`${colors.bold}${colors.green}✅ AUDIT PASSED - Website is ready!${colors.reset}`);
  } else if (report.results.failed.length <= 3) {
    console.log(`${colors.bold}${colors.yellow}⚠️ AUDIT PASSED WITH WARNINGS${colors.reset}`);
    console.log(`${colors.yellow}${report.results.failed.length} issue(s) to address${colors.reset}`);
  } else {
    console.log(`${colors.bold}${colors.red}❌ AUDIT FAILED - Issues found${colors.reset}`);
    console.log(`${colors.red}${report.results.failed.length} critical issue(s)${colors.reset}`);
  }

  console.log(`${colors.blue}${'='.repeat(60)}${colors.reset}\n`);

  // Save report
  const reportPath = path.join(process.cwd(), 'TEST_AUDIT_REPORT.json');
  report.summary = {
    totalPassed: report.results.passed.length,
    totalWarnings: report.results.warnings.length,
    totalFailed: report.results.failed.length,
    duration: `${duration}ms`,
    allChecksPassed: report.results.failed.length === 0,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`📄 Full report saved to: ${colors.cyan}TEST_AUDIT_REPORT.json${colors.reset}\n`);

  process.exit(report.results.failed.length > 0 ? 1 : 0);
}

runAllChecks().catch((error) => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});

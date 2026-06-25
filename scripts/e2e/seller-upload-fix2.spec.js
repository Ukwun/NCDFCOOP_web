const { chromium } = require('playwright');

(async () => {
  const base = process.env.E2E_BASE || 'http://localhost:3000';
  const headless = (process.env.HEADLESS || 'true').toLowerCase() === 'true';
  const browser = await chromium.launch({ headless });
  const page = await browser.newPage();

  try {
    // If test credentials are provided, perform a real Firebase sign-in via the UI.
    const testEmail = process.env.E2E_TEST_EMAIL;
    const testPassword = process.env.E2E_TEST_PASSWORD;

    if (testEmail && testPassword) {
      console.log('Signing in with test credentials');
      await page.goto(`${base}/signin`, { waitUntil: 'load', timeout: 30000 });
      await page.fill('input[type="email"]', testEmail).catch(() => {});
      await page.fill('input[type="password"]', testPassword).catch(() => {});
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load', timeout: 15000 }).catch(() => {}),
        page.click('button:has-text("Sign In")').catch(() => {}),
      ]);
      await page.waitForTimeout(800);
    } else {
      console.log('Visiting dev-login to enable dev autologin');
      await page.goto(`${base}/dev-login`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(1000);

      // Click Dev Seller to set localStorage and redirect
      const sellerBtn = await page.$('button:has-text("Dev Seller")');
      if (sellerBtn) {
        console.log('Clicking Dev Seller for autologin');
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'load', timeout: 5000 }).catch(() => {}),
          sellerBtn.click().catch(() => {}),
        ]);
        await page.waitForTimeout(600);
      } else {
        console.log('Dev Seller button not found, proceeding without click');
      }
    }

    // Now navigate to seller add page
    console.log('Opening add product page (retail)');
    await page.goto(`${base}/seller/products/add`, { waitUntil: 'load' });
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });

    console.log('Filling retail product form');
    await page.fill('input[type="text"]', 'Automated Retail Tomatoes 1kg');
    await page.fill('textarea', 'Fresh automated tomatoes for retail testing');
    await page.click('button:has-text("Vegetables")').catch(() => {});
    await page.click('button:has-text("Retail")').catch(() => {});
    const basePrice = await page.$('//label[contains(normalize-space(.), "Base Price")]/following::input[1]');
    if (basePrice) await basePrice.fill('1200');
    const stockInput = await page.$('//label[contains(normalize-space(.), "Stock Quantity")]/following::input[1]');
    if (stockInput) await stockInput.fill('50');
    await page.selectOption('select', 'kg').catch(() => {});
    // Attach a real image file to test Firebase Storage upload
    const fileInput = await page.$('input[type=file]');
    if (fileInput) {
      try {
        await fileInput.setInputFiles('public/images/logo/NCDFCOOPLOGO.png').catch((err) => {
          console.log('File attach warning:', err.message);
        });
        // wait for preview src to update from placeholder
        await page.waitForSelector('img[alt="Product preview"]', { timeout: 10000 }).catch(() => {
          console.log('Product preview not found after file attach');
        });
        // small delay to allow upload to complete or fallback
        await page.waitForTimeout(1200);
      } catch (err) {
        console.log('File upload flow completed with fallback (expected in dev mode)');
      }
    } else {
      console.log('File input not found, using URL fallback');
      await page.fill('input[type="url"]', 'https://via.placeholder.com/400x400.png?text=Retail').catch(() => {});
    }

    console.log('Publishing retail product');
    await Promise.all([
      page.waitForNavigation({ url: `${base}/seller/products`, waitUntil: 'load', timeout: 5000 }).catch(() => {}),
      page.click('button:has-text("Publish Now")').catch(() => {}),
    ]);

    await page.waitForTimeout(800);

    // Wholesale
    console.log('Opening add product page (wholesale)');
    await page.goto(`${base}/seller/products/add`, { waitUntil: 'load' });
    await page.waitForSelector('input[type="text"]', { timeout: 5000 });

    console.log('Filling wholesale product form');
    await page.fill('input[type="text"]', 'Automated Wholesale Beans 25kg');
    await page.fill('textarea', 'High-quality automated wholesale beans');
    await page.click('button:has-text("Grains & Cereals")').catch(() => {});
    await page.click('button:has-text("Wholesale")').catch(() => {});
    const basePrice2 = await page.$('//label[contains(normalize-space(.), "Base Price")]/following::input[1]');
    if (basePrice2) await basePrice2.fill('45000');
    const wholesalePrice = await page.$('//label[contains(normalize-space(.), "Wholesale Price")]/following::input[1]');
    if (wholesalePrice) await wholesalePrice.fill('35000');
    const moq = await page.$('//label[contains(normalize-space(.), "Wholesale MOQ")]/following::input[1]');
    if (moq) await moq.fill('1');
    const stockInput2 = await page.$('//label[contains(normalize-space(.), "Stock Quantity")]/following::input[1]');
    if (stockInput2) await stockInput2.fill('100');
    const fileInput2 = await page.$('input[type=file]');
    if (fileInput2) {
      try {
        await fileInput2.setInputFiles('public/images/logo/NCDFCOOPLOGO.png').catch((err) => {
          console.log('File attach warning (wholesale):', err.message);
        });
        await page.waitForSelector('img[alt="Product preview"]', { timeout: 10000 }).catch(() => {
          console.log('Product preview not found after file attach (wholesale)');
        });
        await page.waitForTimeout(1200);
      } catch (err) {
        console.log('File upload flow completed with fallback (expected in dev mode)');
      }
    } else {
      console.log('File input not found (wholesale), using URL fallback');
      await page.fill('input[type="url"]', 'https://via.placeholder.com/400x400.png?text=Wholesale').catch(() => {});
    }

    console.log('Publishing wholesale product');
    await Promise.all([
      page.waitForNavigation({ url: `${base}/seller/products`, waitUntil: 'load', timeout: 5000 }).catch(() => {}),
      page.click('button:has-text("Publish Now")').catch(() => {}),
    ]);

    await page.waitForTimeout(800);

    console.log('Navigating to seller products list');
    await page.goto(`${base}/seller/products`, { waitUntil: 'load' });
    console.log('E2E script completed successfully');
  } catch (err) {
    console.error('E2E script error', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();

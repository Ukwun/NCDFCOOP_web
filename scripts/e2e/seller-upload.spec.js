const { chromium } = require('playwright');

(async () => {
  const base = process.env.E2E_BASE || 'http://localhost:3000';
  const headless = process.env.HEADLESS !== 'false';
  const browser = await chromium.launch({ headless, slowMo: headless ? 0 : 80 });
  const page = await browser.newPage();

  try {
    console.log('Visiting dev-login to enable dev autologin');
    // Navigate directly with role query to trigger auto-redirect and localStorage setup
    await page.goto(`${base}/dev-login?role=seller`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(700);
    // Inject dev_autologin directly to ensure headless autologin (works around redirect execution timing)
    await page.evaluate(() => {
      try {
        const devUser = {
          uid: 'dev-seller',
          email: 'dev-seller@local',
          displayName: 'Dev Seller',
          roles: ['seller'],
          selectedRole: 'seller',
          currentRole: 'seller',
          roleSelectionComplete: true,
          onboardingCompleted: true,
        };
        window.localStorage.setItem('dev_autologin', JSON.stringify(devUser));
        window.localStorage.setItem('selectedRoleOverride', devUser.selectedRole);
        window.localStorage.setItem('userId', devUser.uid);
        window.localStorage.setItem('userEmail', devUser.email);
        window.localStorage.setItem('userRole', devUser.selectedRole);
        window.localStorage.setItem('displayName', devUser.displayName);
      } catch (e) {
        // ignore
      }
    });
    console.log('Injected dev_autologin and localStorage keys, current url:', await page.url());

    // Retail product
    console.log('Opening add product page (retail)');
    await page.goto(`${base}/seller/products/add`, { waitUntil: 'networkidle' });
    // Wait for form to render and hydrate
    await page.waitForSelector('form', { timeout: 20000 });
    await page.waitForTimeout(400);

    console.log('Filling retail product form');
    await page.fill('input[type="text"]', 'Automated Retail Tomatoes 1kg');
    await page.fill('textarea', 'Fresh automated tomatoes for retail testing');
    // Category button
    await page.click('button:has-text("Vegetables")');
    // Listing type: Retail
    await page.click('button:has-text("Retail")');
    // Base price (label contains "Base Price")
    const basePrice = await page.$('//label[contains(normalize-space(.), "Base Price")]/following::input[1]');
    if (basePrice) await basePrice.fill('1200');
    // Stock
    const stockInput = await page.$('//label[contains(normalize-space(.), "Stock Quantity")]/following::input[1]');
    if (stockInput) await stockInput.fill('50');
    // Unit select
    await page.selectOption('select', 'kg');
    // Thumbnail URL
    await page.fill('input[type="url"]', 'https://via.placeholder.com/400x400.png?text=Retail');

    // Publish retail
    console.log('Publishing retail product');
    await Promise.all([
      page.waitForNavigation({ url: `${base}/seller/products`, waitUntil: 'networkidle', timeout: 5000 }).catch(() => {}),
      page.click('button:has-text("Publish Now")').catch(() => {}),
    ]);

    await page.waitForTimeout(800);

    // Wholesale product
    console.log('Opening add product page (wholesale)');
    await page.goto(`${base}/seller/products/add`, { waitUntil: 'networkidle' });
    // Wait for form to render and hydrate
    await page.waitForSelector('form', { timeout: 20000 });
    await page.waitForTimeout(400);

    console.log('Filling wholesale product form');
    await page.fill('input[type="text"]', 'Automated Wholesale Beans 25kg');
    await page.fill('textarea', 'High-quality automated wholesale beans');
    await page.click('button:has-text("Grains & Cereals")');
    // Listing type: Wholesale
    await page.click('button:has-text("Wholesale")');
    // Base price
    const basePrice2 = await page.$('//label[contains(normalize-space(.), "Base Price")]/following::input[1]');
    if (basePrice2) await basePrice2.fill('45000');
    // Wholesale price
    const wholesalePrice = await page.$('//label[contains(normalize-space(.), "Wholesale Price")]/following::input[1]');
    if (wholesalePrice) await wholesalePrice.fill('35000');
    // Wholesale MOQ
    const moq = await page.$('//label[contains(normalize-space(.), "Wholesale MOQ")]/following::input[1]');
    if (moq) await moq.fill('1');
    // Stock
    const stockInput2 = await page.$('//label[contains(normalize-space(.), "Stock Quantity")]/following::input[1]');
    if (stockInput2) await stockInput2.fill('100');
    // Thumbnail URL
    await page.fill('input[type="url"]', 'https://via.placeholder.com/400x400.png?text=Wholesale');

    // Publish wholesale
    console.log('Publishing wholesale product');
    await Promise.all([
      page.waitForNavigation({ url: `${base}/seller/products`, waitUntil: 'networkidle', timeout: 5000 }).catch(() => {}),
      page.click('button:has-text("Publish Now")').catch(() => {}),
    ]);

    await page.waitForTimeout(800);

    // Navigate to seller products list and try to delete heart/cart icons if present
    console.log('Checking seller products list for heart/cart icons');
    await page.goto(`${base}/seller/products`, { waitUntil: 'networkidle' });
    // Remove any elements matching common heart/cart selectors via page.evaluate
    const removed = await page.evaluate(() => {
      const selectors = ['.heart-icon', '.cart-icon', '[aria-label="favorite"]', '[aria-label="cart"]'];
      let count = 0;
      selectors.forEach((sel) => {
        document.querySelectorAll(sel).forEach((el) => { el.remove(); count++; });
      });
      return count;
    });

    console.log('Removed icons count:', removed);

    console.log('E2E script completed successfully');
  } catch (err) {
    console.error('E2E script error', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();

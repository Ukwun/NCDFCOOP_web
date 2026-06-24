const { chromium } = require('playwright');

(async () => {
  const base = process.env.E2E_BASE || 'http://localhost:3000';
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Visiting dev-login to enable dev autologin');
    await page.goto(`${base}/dev-login`, { waitUntil: 'load' });
    await page.waitForTimeout(500);

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
    await page.fill('input[type="url"]', 'https://via.placeholder.com/400x400.png?text=Retail').catch(() => {});

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
    await page.fill('input[type="url"]', 'https://via.placeholder.com/400x400.png?text=Wholesale').catch(() => {});

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

const { chromium } = require('playwright');
const fs = require('fs');

(async () => {
  const base = process.env.E2E_BASE || 'http://localhost:3000';
  const outDir = './scripts/e2e/screenshots';
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  try {
    console.log('Opening SignIn for baseline');
    await page.goto(`${base}/signin`, { waitUntil: 'load' });
    await page.screenshot({ path: `${outDir}/signin.png`, fullPage: true });

    console.log('Opening dev-login and autologin as seller');
    await page.goto(`${base}/dev-login`, { waitUntil: 'load' });
    await page.waitForTimeout(800);
    const sellerBtn = await page.$('button:has-text("Dev Seller")');
    if (sellerBtn) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'load', timeout: 8000 }).catch(() => {}),
        sellerBtn.click().catch(() => {}),
      ]);
      await page.waitForTimeout(1000);
    }

    console.log('Opening Add Product and capturing screenshot (with retry)');
    for (let i = 0; i < 3; i++) {
      try {
        await page.goto(`${base}/seller/products/add`, { waitUntil: 'load', timeout: 8000 });
        await page.waitForTimeout(500);
        await page.screenshot({ path: `${outDir}/add-product.png`, fullPage: true });
        break;
      } catch (err) {
        console.warn('Attempt', i+1, 'failed to load add page, retrying...');
        await page.waitForTimeout(800);
        if (i === 2) throw err;
      }
    }

    console.log('Opening Seller Products and capturing screenshot');
    await page.goto(`${base}/seller/products`, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${outDir}/seller-products.png`, fullPage: true });

    console.log('Screenshots saved to', outDir);
  } catch (err) {
    console.error('Visual checks failed', err);
    process.exitCode = 2;
  } finally {
    await browser.close();
  }
})();

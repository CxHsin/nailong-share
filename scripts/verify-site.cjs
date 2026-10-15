// Run against `npm run build && npm run preview`. Uses the bundled Playwright
// when PLAYWRIGHT_MODULE is set, or a locally installed Playwright otherwise.
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const origin = process.env.SITE_URL || 'http://127.0.0.1:4321';
const output = path.join(__dirname, '../artifacts');
fs.mkdirSync(output, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true, ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}) });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(origin);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(output, 'home-desktop.png'), fullPage: true });
  const cardCount = await page.locator('.note-card').count();
  assert.equal(cardCount, 2);
  await page.getByRole('button', { name: '系统设计', exact: true }).click();
  assert.equal(await page.locator('.note-card:visible').count(), 1);
  await page.getByRole('button', { name: '全部', exact: true }).click();
  assert.equal(await page.locator('.note-card:visible').count(), 2);
  await page.getByRole('button', { name: '切换至浅色模式' }).click();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await page.reload();
  assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
  await page.getByRole('button', { name: '切换至深色模式' }).click();
  await page.getByRole('searchbox').fill('记忆');
  await page.waitForFunction(() => document.querySelector('#search-status').textContent.includes('篇相关内容'), { timeout: 15000 });
  assert(await page.locator('.search-result').count() > 0, 'Chinese body search should find matches');
  await page.screenshot({ path: path.join(output, 'search-desktop.png') });
  const searchLink = page.locator('.result-section').first();
  assert((await searchLink.getAttribute('href')).includes('#'), 'Body results should link to a section');
  await searchLink.click();
  await page.waitForURL(/\/read\/always-on-agents\//);
  await page.goto(origin);
  await page.locator('.note-card').first().click();
  await page.waitForURL(/\/read\/always-on-agents\//);
  assert.equal(await page.locator('h1').count(), 1);
  assert.equal(await page.locator('.prose table tbody tr').count(), 7);
  assert(await page.locator('.prose pre').count() >= 2);
  assert.equal(await page.locator('.prose img[src*="diagram-"]').count(), 2);
  assert(await page.locator('.toc-link').count() > 10);
  const tocLink = page.locator('.toc-link').filter({ hasText: '开场代码' }).first();
  await tocLink.click();
  await page.waitForFunction(() => { const h = document.getElementById(decodeURIComponent(location.hash.slice(1))); return h && h.getBoundingClientRect().top >= 88 && h.getBoundingClientRect().top < 260; });
  await page.screenshot({ path: path.join(output, 'reading-code.png') });
  const pdfPath = await page.locator('.download-button').getAttribute('href');
  const pdfResponse = await page.request.get(origin + pdfPath);
  assert.equal(pdfResponse.status(), 200);
  const downloadedPdf = await pdfResponse.body();
  assert.equal(downloadedPdf.subarray(0, 5).toString(), '%PDF-');
  const expectedPdf = fs.readFileSync(path.join(__dirname, '../public', pdfPath));
  assert.equal(crypto.createHash('sha256').update(downloadedPdf).digest('hex'), crypto.createHash('sha256').update(expectedPdf).digest('hex'));
  for (const slug of ['always-on-agents', 'high-trust-software']) {
    await page.goto(`${origin}/read/${slug}/`);
    const sources = await page.locator('.prose img').evaluateAll(images => images.map(i => i.src));
    for (const src of sources) assert.equal((await page.request.get(src)).status(), 200, src);
    assert(!(await page.locator('.prose').innerText()).match(/\\(?:begin|sbox|usebox|includegraphics)\b/), 'No unconverted TeX');
  }
  await page.goto(`${origin}/read/always-on-agents/`);
  await page.screenshot({ path: path.join(output, 'reading-desktop.png'), fullPage: false });
  const tocDestinations = await page.locator('.toc-link').evaluateAll(links => links.every(a => !!document.getElementById(decodeURIComponent(a.hash.slice(1)))));
  assert(tocDestinations, 'Every TOC item must target an actual heading');
  for (const width of [375, 768]) {
    await page.setViewportSize({width, height: 900});
    for (const route of ['/', '/read/always-on-agents/', '/read/high-trust-software/']) {
      await page.goto(origin + route);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow at ${width}: ${route}`);
    }
  }
  await page.setViewportSize({width:375,height:900});
  await page.goto(origin);
  await page.screenshot({ path:path.join(output, 'home-mobile.png'), fullPage:true });
  await page.locator('.note-card').first().click();
  await page.locator('.mobile-toc summary').click();
  await page.locator('.mobile-toc nav a').filter({hasText:'开场代码'}).first().click();
  assert.equal(await page.locator('.mobile-toc').getAttribute('open'), null);
  const rect = await page.locator('.download-button').boundingBox();
  assert(rect && rect.y >= 0 && rect.y < 76, 'Download stays available at top right while reading');
  await page.goto(`${origin}/read/always-on-agents/`);
  await page.screenshot({path:path.join(output,'reading-mobile.png'),fullPage:false});
  await page.getByRole('button', {name:'切换至浅色模式'}).click();
  await page.screenshot({path:path.join(output,'reading-light-mobile.png'),fullPage:false});
  assert.deepEqual(errors, [], 'No browser script errors');
  await browser.close();
  console.log('PASS: navigation, filters, Chinese body search and anchors, theme persistence, original PDF bytes, TOC, code/diagrams/tables, all content images, mobile/tablet layouts, and sticky download.');
})().catch(error => { console.error(error); process.exit(1); });

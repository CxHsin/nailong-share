// Run against a production preview; optional PLAYWRIGHT_MODULE and CHROMIUM_PATH
// point to an existing Playwright installation and Chromium executable.
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
  try {
    const page = await browser.newPage({ viewport: { width: 1466, height: 780 }, deviceScaleFactor: 1 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const screenshot = async (name, fullPage = false, keepPointer = false) => {
      await page.evaluate(() => document.fonts.ready);
      if (!keepPointer) await page.mouse.move(0, 0);
      await page.screenshot({ path: path.join(output, name + '.png'), fullPage });
    };
    await page.goto(origin);
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    assert.equal(await page.locator('body').evaluate(body => getComputedStyle(body).backgroundColor), 'rgb(23, 23, 23)');
    assert.equal(await page.getByRole('heading', {level:1}).count(), 1);
    assert.equal(await page.locator('.note-card').count(), 2);
    for (const [index, handle] of ['leerob', 'poteto'].entries()) {
      const authorLink = page.locator('.card-author-link').nth(index);
      assert.equal(await authorLink.getAttribute('href'), 'https://x.com/' + handle);
      assert.equal(await authorLink.getAttribute('target'), '_blank');
      await authorLink.locator('img').evaluate(img => img.decode());
      assert(await authorLink.locator('img').evaluate(img => img.naturalWidth > 0), 'Homepage author avatar loads');
    }
    assert.equal(await page.locator('.recommendations, .welcome-banner, .header-menu').count(), 0);
    const feedBox = await page.locator('.library').boundingBox();
    assert(Math.abs(feedBox.x + feedBox.width / 2 - 733) < 1, 'Article list is centered');
    const searchBox = await page.getByRole('search').boundingBox();
    assert(Math.abs(searchBox.x + searchBox.width / 2 - 733) < 1, 'Header search is centered');
    await screenshot('home-desktop');
    assert.equal(await page.locator('.card-tools, .tag-filters').count(), 0);
    assert.equal(await page.locator('.header-actions > *').count(), 1);
    const recent = page.getByRole('button', { name: '最近整理', exact: true });
    const recommended = page.getByRole('button', { name: '为你推荐', exact: true });
    await recent.click();
    assert.equal(await recent.getAttribute('aria-pressed'), 'true');
    assert.equal(await recommended.getAttribute('aria-pressed'), 'false');
    assert.equal(await page.locator('.note-card:visible').count(), 2);
    const dates = await page.locator('.note-card:visible time').evaluateAll(times => times.map(time => time.dateTime));
    assert.deepEqual(dates, [...dates].sort().reverse(), 'Recent notes are newest first');
    assert.equal(await page.locator('.feed-end').innerText(), '以上是最近整理的 2 篇笔记');
    await page.getByRole('button', { name: '切换至浅色模式' }).click();
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    await screenshot('home-light-desktop');
    await page.getByRole('button', { name: '切换至深色模式' }).click();
    await page.reload();
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'dark');
    await recent.click();
    await page.keyboard.press('/');
    assert(await page.getByRole('searchbox').evaluate(input => input === document.activeElement));
    await page.getByRole('searchbox').fill('记忆');
    await page.waitForFunction(() => document.querySelector('#search-status').textContent.includes('篇相关内容'));
    assert(await page.locator('.search-result').count() > 0);
    await screenshot('search-desktop');
    await page.keyboard.press('Escape');
    assert.equal(await page.getByRole('searchbox').inputValue(), '');
    assert.equal(await page.locator('#search-results').isVisible(), false);
    assert.equal(await page.locator('.note-card:visible').count(), 2);
    assert.equal(await recent.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.feed-end').innerText(), '以上是最近整理的 2 篇笔记');
    await recommended.click();
    assert.equal(await recommended.getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('.feed-end').innerText(), '以上是全部 2 篇笔记');
    await page.getByRole('searchbox').fill('记忆');
    await page.waitForFunction(() => document.querySelector('#search-status').textContent.includes('篇相关内容'));
    const result = page.locator('.result-section').first();
    assert((await result.getAttribute('href')).includes('#'));
    await result.click();
    await page.waitForURL(/\/read\/always-on-agents\//);
    await page.goto(origin);
    await page.locator('.card-link').first().click();
    await page.waitForURL(/\/read\/always-on-agents\//);
    assert.equal(await page.locator('h1').count(), 1);
    assert.equal(await page.locator('.prose table tbody tr').count(), 7);
    assert(await page.locator('.prose pre').count() >= 2);
    assert.equal(await page.locator('.prose img[src*="diagram-"]').count(), 2);
    assert.equal(await page.locator('.author-sidebar, .complete-note, .article-header .source-pill, .article-header .article-toolbar').count(), 0);
    assert.equal(Math.round((await page.locator('.prose').boundingBox()).width), 680);
    assert.equal(Math.round((await page.locator('.article-cover').boundingBox()).width), 680);
    await screenshot('reading-desktop');
    const directory = page.getByRole('navigation', {name: '章节目录', exact: true});
    const directoryLinks = directory.locator('a');
    assert.equal(await directoryLinks.count(), await page.locator('.prose h2').count());
    assert(await directoryLinks.evaluateAll(links => links.every(link => document.getElementById(decodeURIComponent(link.hash.slice(1))))));
    const collapsed = await directory.boundingBox();
    assert.equal(await directoryLinks.first().locator('span').evaluate(el => getComputedStyle(el).opacity), '0');
    await directory.hover();
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.side-toc a span')).opacity === '1');
    const expanded = await directory.boundingBox();
    assert(expanded.y < collapsed.y && expanded.y + expanded.height > collapsed.y + collapsed.height, 'Directory extends up and down');
    assert(Math.abs(expanded.y + expanded.height / 2 - collapsed.y - collapsed.height / 2) < 1);
    await screenshot('reading-directory-expanded', false, true);
    await directoryLinks.nth(1).click();
    const selectedHref = await directoryLinks.nth(1).getAttribute('href');
    await page.waitForFunction(href => {
      const heading = document.getElementById(decodeURIComponent(href.slice(1)));
      return heading.getBoundingClientRect().top >= 56 && heading.getBoundingClientRect().top < 120
        && document.querySelector('.side-toc a[aria-current]').getAttribute('href') === href;
    }, selectedHref);
    await page.mouse.move(0, 0);
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.side-toc a span')).opacity === '0');
    await directory.focus();
    await page.keyboard.press('Tab');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('.side-toc a span')).opacity === '1');
    await page.evaluate(() => document.activeElement.blur());
    const codeSection = await page.locator('.prose h2, .prose h3').filter({hasText:'开场代码'}).first().getAttribute('id');
    assert(codeSection);
    await page.goto(origin + '/read/always-on-agents/#' + encodeURIComponent(codeSection));
    await page.waitForFunction(() => {
      const h = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      return h && h.getBoundingClientRect().top >= 56 && h.getBoundingClientRect().top < 180;
    });
    await screenshot('reading-code');
    for (const slug of ['always-on-agents', 'high-trust-software']) {
      await page.goto(origin + '/read/' + slug + '/');
      await screenshot('reading-' + slug);
      assert.equal(await page.locator('.author-sidebar, .complete-note, .article-header .source-pill, .article-header .article-toolbar').count(), 0);
      const authorLink = page.locator('.article-byline .byline-author');
      assert.equal(await authorLink.getAttribute('href'), slug === 'always-on-agents' ? 'https://x.com/leerob' : 'https://x.com/poteto');
      assert.equal(await authorLink.getAttribute('target'), '_blank');
      const avatar = authorLink.locator('img');
      assert.equal(await avatar.getAttribute('src'), '/media/' + slug + '/avatar.jpg');
      await avatar.evaluate(img => img.decode());
      assert(await avatar.evaluate(img => img.naturalWidth > 0), 'Author avatar loads');
      assert.equal(await page.locator('.article-end .static-tools, .article-end .story-tools').count(), 0);
      const pdfPath = await page.getByRole('link', {name:'保存 PDF',exact:true}).getAttribute('href');
      const response = await page.request.get(origin + pdfPath);
      assert.equal(response.status(), 200);
      const actual = await response.body();
      const expected = fs.readFileSync(path.join(__dirname, '../public', pdfPath));
      assert.equal(actual.subarray(0, 5).toString(), '%PDF-');
      assert.equal(crypto.createHash('sha256').update(actual).digest('hex'), crypto.createHash('sha256').update(expected).digest('hex'));
      for (const src of await page.locator('.prose img, .article-cover img').evaluateAll(images => images.map(i => i.src))) {
        assert.equal((await page.request.get(src)).status(), 200, src);
      }
      assert(!(await page.locator('.prose').innerText()).match(/\\(?:begin|sbox|usebox|includegraphics)\b/));
    }
    // A search submitted from an article lands on matching homepage results.
    await page.getByRole('searchbox').fill('记忆');
    await page.getByRole('searchbox').press('Enter');
    await page.waitForURL(/\?q=/);
    await page.waitForFunction(() => document.querySelector('#search-status').textContent.includes('篇相关内容'));
    assert(await page.locator('.search-result').count() > 0);
    for (const width of [320, 375, 768]) {
      await page.setViewportSize({width, height:900});
      for (const route of ['/', '/read/always-on-agents/', '/read/high-trust-software/']) {
        await page.goto(origin + route);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'No overflow at ' + width + ': ' + route);
        if (route === '/') {
          assert.equal(await page.locator('.recommendations, .welcome-banner, .header-menu').count(), 0);
          await screenshot('home-' + width, true);
        } else {
          assert.equal(await page.locator('.author-sidebar').count(), 0);
          assert.equal(await page.locator('.side-toc').isVisible(), false);
          const column = await page.locator('.prose').boundingBox();
          assert.equal(Math.round(column.width), Math.min(680, width - 48));
          assert(Math.abs(column.x + column.width / 2 - width / 2) < 1, 'Reading margins match the reference');
          if (width === 375) await screenshot('mobile-' + route.split('/')[2]);
        }
      }
    }
    await page.setViewportSize({width:375,height:900});
    await page.goto(origin);
    await screenshot('home-mobile', true);
    await page.locator('.card-link').first().click();
    assert.equal(await page.locator('.article-toc').count(), 0);
    await page.goto(origin + '/read/always-on-agents/');
    await page.getByRole('button', {name:'切换至浅色模式'}).click();
    await screenshot('reading-light-mobile');
    await page.goto(origin);
    assert.equal(await page.locator('html').getAttribute('data-theme'), 'light');
    const freshPage = await browser.newPage();
    await freshPage.goto(origin + '/read/always-on-agents/');
    assert.equal(await freshPage.locator('html').getAttribute('data-theme'), 'dark');
    await freshPage.close();
    assert.deepEqual(errors, [], 'No browser script errors');
    console.log('PASS: Reading margins, animated side directory, section tracking and navigation, keyboard focus, desktop/tablet/mobile, search, themes, complete content, and PDF downloads.');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exit(1); });

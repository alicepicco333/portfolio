// Check: the statement's selected phrase in high contrast (a solid block), and the In progress section.
const { chromium } = require("C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright");
const path = require("path");
const OUT = path.join(__dirname, "..", "fix-shots");
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem("ap-contrast", "high"); } catch (e) {} });
  const page = await ctx.newPage();
  await page.goto("http://127.0.0.1:3001/", { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(3500);
  console.log("hc selected phrase:", await page.evaluate(() => {
    const s = document.querySelector('.map-intro [role="button"][aria-pressed="true"]');
    return s ? s.textContent + " | bg " + getComputedStyle(s).backgroundColor + " | color " + getComputedStyle(s).color : "none";
  }));
  await page.screenshot({ path: path.join(OUT, "hero-1440-hc.png") });
  await ctx.close();
  const p2 = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await p2.goto("http://127.0.0.1:3001/#in-progress", { waitUntil: "load", timeout: 120000 });
  await p2.waitForTimeout(1500);
  await p2.locator("#in-progress").screenshot({ path: path.join(OUT, "in-progress-1440.png") });
  await browser.close();
})().catch((e) => { console.log("FAILED", e.message); process.exit(1); });

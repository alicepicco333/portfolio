// Probe: the homepage keyboard stops 36-45 (the timeline) that the audit found focused but not visible. Waits for
// the smooth scroll and the reveal, then reports whether the focused element and its ring can be seen.
const { chromium } = require("C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright");
const path = require("path");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://127.0.0.1:3001/", { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(2500);
  for (let i = 1; i <= 45; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(i < 35 ? 80 : 1800);
    if (i < 36) continue;
    const info = await page.evaluate(() => {
      const el = document.activeElement, b = el.getBoundingClientRect();
      let op = 1;
      for (let n = el; n && n !== document.documentElement; n = n.parentElement) op *= parseFloat(getComputedStyle(n).opacity);
      const lab = el.labels && el.labels[0];
      const lb = lab ? getComputedStyle(lab) : null;
      return { name: (el.getAttribute("aria-label") || el.innerText || (lab && lab.innerText) || "").trim().slice(0, 40),
        inView: b.top >= 0 && b.bottom <= innerHeight, top: Math.round(b.top), opacity: +op.toFixed(2),
        labelRing: lb ? lb.outlineStyle + " " + lb.outlineWidth + " / " + lb.boxShadow.slice(0, 40) : undefined };
    });
    console.log(i, JSON.stringify(info));
    if ([36, 37, 39, 43].includes(i)) await page.screenshot({ path: path.join(__dirname, "..", `focus-stop-${i}.png`) });
  }
  await browser.close();
})().catch((e) => { console.log("FAILED", e.message); process.exit(1); });

// Probe: where the timeline's project labels, the ROLES/PROJECTS labels and the playhead label sit, against the
// svg's visible width, at rest and halfway through the sweep.
const { chromium } = require("C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright");
const path = require("path");
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto("http://127.0.0.1:3001/", { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(2000);
  const report = () => page.evaluate(() => {
    const svg = document.querySelector("#journey svg");
    const sb = svg.getBoundingClientRect();
    const items = [...svg.querySelectorAll("a.jr-item text")].map((t) => {
      const b = t.getBoundingClientRect();
      return `${t.textContent} [${Math.round(b.left)}-${Math.round(b.right)}] anchor ${t.getAttribute("text-anchor")}${b.right > sb.right ? " OVER by " + Math.round(b.right - sb.right) : ""}`;
    });
    const lab = svg.querySelector('[data-part="label"]').getBoundingClientRect();
    const roles = [...svg.querySelectorAll("text")].filter((t) => /^(ROLES|STUDIES|PROJECTS)$/.test(t.textContent)).map((t) => { const b = t.getBoundingClientRect(); return t.textContent + " " + [b.left, b.top, b.right, b.bottom].map(Math.round).join(","); });
    return { svg: [sb.left, sb.right].map(Math.round), items, playhead: [lab.left, lab.top, lab.right, lab.bottom].map(Math.round), roles };
  });
  await page.locator("#journey").scrollIntoViewIfNeeded();
  await page.waitForTimeout(1500);
  console.log("entering:", JSON.stringify(await report(), null, 1));
  const top = await page.evaluate(() => document.querySelector("#journey").getBoundingClientRect().top + scrollY);
  await page.evaluate((y) => scrollTo(0, y + 300), top);
  await page.waitForTimeout(1500);
  console.log("mid-sweep playhead/roles:", JSON.stringify(await report().then((r) => ({ playhead: r.playhead, roles: r.roles }))));
  await page.screenshot({ path: path.join(__dirname, "..", "fix-shots", "timeline-mid.png") });
  await browser.close();
})().catch((e) => { console.log("FAILED", e.message); process.exit(1); });

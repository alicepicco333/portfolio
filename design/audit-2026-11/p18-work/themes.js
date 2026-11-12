// The plates' "Open full size" line at 390 x 844 in the dark and high-contrast themes, with a plate link
// focused from the keyboard. Usage: node themes.js -> shots/theme-390-<name>.jpg
const path = require("path");
const { chromium } = require("C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright");

(async () => {
  const browser = await chromium.launch();
  for (const [name, attrs] of [["dark", { "data-theme": "dark" }], ["hc", { "data-contrast": "high" }], ["dark-hc", { "data-theme": "dark", "data-contrast": "high" }]]) {
    const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto("http://127.0.0.1:3001/projects/18", { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForSelector("#part-1", { timeout: 60000 });
    await page.evaluate((a) => Object.entries(a).forEach(([k, v]) => document.documentElement.setAttribute(k, v)), attrs);
    const link = page.locator("#part-1 figure a").first();
    await link.focus();
    await page.evaluate(() => {
      const r = document.querySelector("#part-1").getBoundingClientRect();
      window.scrollTo(0, window.scrollY + r.top - 73);
    });
    await page.waitForTimeout(1200);
    const colours = await page.evaluate(() => {
      const s = document.querySelector("#part-1 figure a span");
      const cs = getComputedStyle(s);
      return { color: cs.color, decoration: cs.textDecorationColor, bg: getComputedStyle(document.body).backgroundColor, outline: getComputedStyle(s.parentElement).outlineColor };
    });
    await page.screenshot({ path: path.join(__dirname, "shots", `theme-390-${name}.jpg`), quality: 80 });
    console.log(name, JSON.stringify(colours), errors.length ? errors : "");
    await page.close();
  }
  await browser.close();
})();

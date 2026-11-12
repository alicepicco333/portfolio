// The video panel at in-between window sizes: video and transcript boxes, and whether the transcript
// fits its half. Usage: node widths.js  -> shots/widths-<w>x<h>-clip.jpg
const path = require("path");
const { chromium } = require("C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright");

(async () => {
  const browser = await chromium.launch();
  for (const [w, h] of [[768, 1024], [820, 1180], [1024, 768], [1280, 720], [1920, 1080]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("http://127.0.0.1:3001/projects/18", { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForSelector("#clip-title", { timeout: 60000 });
    const r = await page.evaluate(() => {
      const s = document.querySelector("section[aria-labelledby=clip-title]");
      const panel = s.querySelector(":scope > div:nth-child(2)");
      const head = document.querySelector("header").getBoundingClientRect().height;
      window.scrollTo(0, window.scrollY + panel.getBoundingClientRect().top - head - 8);
      const b = (e) => (({ x, y, width, height }) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(width), h: Math.round(height) }))(e.getBoundingClientRect());
      const p = b(panel), v = b(s.querySelector("video")), l = b(s.querySelector("ol"));
      const lis = [...s.querySelectorAll("li")];
      const widest = Math.max(...lis.map((li) => { const rg = document.createRange(); rg.selectNodeContents(li); return Math.round(rg.getBoundingClientRect().width); }));
      return { panel: p, video: v, list: l, font: getComputedStyle(lis[0]).fontSize, widestLine: widest, fitsDown: l.y + l.h <= p.y + p.h, fitsRight: l.x + widest <= p.x + p.w, plateLine: getComputedStyle(document.querySelector("#part-1 figure a span")).display };
    });
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(__dirname, "shots", `widths-${w}x${h}-clip.jpg`), quality: 75 });
    console.log(`${w}x${h}`, JSON.stringify(r), errors.length ? errors : "");
    await page.close();
  }
  await browser.close();
})();

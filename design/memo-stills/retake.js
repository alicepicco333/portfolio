// Retakes every picture of The Meme Ontology on the portfolio from the live site (thememeontology.netlify.app):
// the project page's stills (public/images/projects/memo), and the raw shots derive.py turns into the card, the
// square and the two hero-map pictures. Same names and sizes each time, so the page needs no change.
//   node design/memo-stills/retake.js && python design/memo-stills/derive.py
// Requests carry Playwright's own browser and user agent; no contact details anywhere.
const { chromium } = require("C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright");
const path = require("path");
const fs = require("fs");
const SITE = "https://thememeontology.netlify.app";
const ROOT = path.resolve(__dirname, "..", "..");
const DIR = path.join(ROOT, "public/images/projects/memo");
const RAW = path.join(__dirname, "raw"); // not committed: derive.py reads it
fs.mkdirSync(RAW, { recursive: true });
const VIZ = ["time", "popularity", "platform-time", "variant-bubble", "variant-gallery", "family", "spectrum", "walk", "story", "confidence", "flow"];
const NAME = { spectrum: "spectrum-wheel" };
const jpg = (p) => ({ path: p, type: "jpeg", quality: 86 });

(async () => {
  const browser = await chromium.launch();
  const log = (...a) => console.log(...a);
  const missing = [];

  // desktop, 1440 x 900 at 1.25 (1800 x 1125)
  const d = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.25 });
  const page = await d.newPage();
  await page.goto(SITE + "/visualizations", { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(3000);
  for (const id of VIZ) {
    const sec = page.locator("#sec-" + id);
    if (!(await sec.count())) { missing.push("viz " + id); continue; }
    await sec.evaluate((el) => el.scrollIntoView({ block: "start" }));
    await page.waitForTimeout(3500);
    await page.screenshot(jpg(path.join(DIR, `viz-${NAME[id] || id}.jpg`)));
    log("viz", id);
  }
  for (const view of ["dataset", "ontology"]) {
    await page.goto(SITE + "/visualizations#" + view, { waitUntil: "networkidle", timeout: 120000 });
    await page.waitForTimeout(3500);
    await page.screenshot(jpg(path.join(DIR, `${view}.jpg`)));
    log("view", view);
  }
  await page.goto(SITE + "/sparql", { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(3000);
  await page.screenshot(jpg(path.join(DIR, "sparql.jpg")));
  await page.goto(SITE + "/thesis", { waitUntil: "networkidle", timeout: 120000 });
  await page.waitForTimeout(3000);
  await page.screenshot(jpg(path.join(DIR, "thesis.jpg")));
  const search = page.locator('input[type="search"], input[placeholder*="earch"]').first();
  if (await search.count()) {
    await search.fill("template");
    await search.press("Enter").catch(() => {});
    await page.waitForTimeout(2000);
  } else missing.push("thesis search box");
  await page.screenshot(jpg(path.join(DIR, "thesis-search.jpg")));
  log("sparql, thesis, thesis-search");
  await d.close();

  // the hero map's pictures: home and visualizations at 1440 x 900, plain scale
  const s = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const sp = await s.newPage();
  for (const [name, url] of [["home-1440", "/"], ["viz-1440", "/visualizations"]]) {
    await sp.goto(SITE + url, { waitUntil: "networkidle", timeout: 120000 });
    await sp.waitForTimeout(4000);
    await sp.screenshot({ path: path.join(RAW, name + ".png") });
    log("raw", name);
  }
  await s.close();

  // the hero, 1600 x 1000 at 1.25 (2000 x 1250): the project page's first picture, and the card and square
  const h = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1.25 });
  const hp = await h.newPage();
  await hp.goto(SITE + "/", { waitUntil: "networkidle", timeout: 120000 });
  await hp.waitForTimeout(4000);
  await hp.screenshot(jpg(path.join(DIR, "hero-v2.jpg")));
  await hp.screenshot({ path: path.join(RAW, "home-1600.png") });
  log("hero");
  await h.close();

  // phone, 390 x 844 at 1.5 (585 x 1266)
  const m = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1.5, isMobile: true, hasTouch: true });
  const mp = await m.newPage();
  const phone = async (url, file, before) => {
    await mp.goto(SITE + url, { waitUntil: "networkidle", timeout: 120000 });
    await mp.waitForTimeout(3500);
    if (before) await before();
    await mp.screenshot(jpg(path.join(DIR, file)));
    log("phone", file);
  };
  await phone("/", "m-home-v2.jpg");
  await phone("/", "m-random.jpg", async () => {
    const r = mp.locator('a:has-text("Random meme"), button:has-text("Random meme")').first();
    if (await r.count()) { await r.click({ force: true }).catch(() => {}); await mp.waitForTimeout(3500); } else missing.push("random meme button");
  });
  await phone("/visualizations", "m-viz.jpg");
  await phone("/thesis", "m-thesis.jpg");
  await browser.close();
  log("missing:", missing.length ? missing.join(", ") : "none");
})().catch((e) => { console.log("FAILED", e.message); process.exit(1); });

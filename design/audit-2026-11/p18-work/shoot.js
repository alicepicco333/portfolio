// Screenshots of /projects/18 on the dev server at 1440 x 900 and 390 x 844, with console and page errors,
// and a check that the Arduino car video's captions load and light the transcript. Usage: node shoot.js <tag>
// Writes shots/<tag>-<width>-<part>.jpg next to this script: viewport shots with the part scrolled to just
// under the sticky header, and one full page.
const path = require("path");
const fs = require("fs");
const { chromium } = require("C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright");

const URL = "http://127.0.0.1:3001/projects/18";
const tag = process.argv[2] || "now";
const OUT = path.join(__dirname, "shots");
fs.mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch();
  const report = [];
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h } });
    const errors = [];
    page.on("pageerror", (e) => errors.push("pageerror: " + e.message));
    page.on("console", (m) => m.type() === "error" && errors.push("console: " + m.text()));
    page.on("requestfailed", (r) => errors.push("requestfailed: " + r.url() + " " + (r.failure() || {}).errorText));
    await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 120000 });
    await page.waitForSelector("#try-title", { timeout: 60000 });
    await page.waitForTimeout(1500);
    const head = await page.evaluate(() => Math.round(document.querySelector("header").getBoundingClientRect().height));
    // scroll `sel` to just under the header (minus `lead` px of the section above it) and shoot the window
    const view = async (name, sel, lead = 0) => {
      // twice: lazy plates above the target load on the way and push it down
      for (let i = 0; i < 2; i++) {
        await page.evaluate(([s, off]) => {
          const r = document.querySelector(s).getBoundingClientRect();
          window.scrollTo(0, window.scrollY + r.top - off);
        }, [sel, head + 8 + lead]);
        await page.waitForFunction(() => [...document.images].filter((im) => im.getBoundingClientRect().top < innerHeight).every((im) => im.complete), null, { timeout: 15000 }).catch(() => {});
        await page.waitForTimeout(900);
      }
      await page.screenshot({ path: path.join(OUT, `${tag}-${w}-${name}.jpg`), quality: 82 });
    };
    // the 3D viewer's poster
    await view("try", "section[aria-labelledby=try-title] > div:nth-child(2)");
    // the video panel: wait for a line to be lit, then shoot
    await view("clip", "section[aria-labelledby=clip-title] > div:nth-child(2)");
    await page.waitForFunction(() => document.querySelector("section[aria-labelledby=clip-title] li[aria-current=true]"), null, { timeout: 15000 }).catch(() => {});
    await page.screenshot({ path: path.join(OUT, `${tag}-${w}-clip.jpg`), quality: 82 });
    const media = await page.evaluate(() => {
      const v = document.querySelector("section[aria-labelledby=clip-title] video");
      const t = v && v.querySelector("track");
      const b = document.querySelector("section[aria-labelledby=clip-title] button");
      const box = (e) => e && (({ x, y, width, height }) => ({ x: Math.round(x), y: Math.round(y), w: Math.round(width), h: Math.round(height) }))(e.getBoundingClientRect());
      return {
        trackReadyState: t ? t.readyState : null,
        cues: t && t.track.cues ? t.track.cues.length : null,
        paused: v ? v.paused : null,
        lit: (document.querySelector("section[aria-labelledby=clip-title] li[aria-current=true]") || {}).textContent || null,
        video: box(v),
        panel: box(v && v.closest("section").querySelector(":scope > div:nth-child(2)")),
        list: box(document.querySelector("section[aria-labelledby=clip-title] ol")),
        listFont: getComputedStyle(document.querySelector("section[aria-labelledby=clip-title] li")).fontSize,
        button: b ? { text: b.textContent.trim(), pressed: b.getAttribute("aria-pressed"), svg: !!b.querySelector("svg[aria-hidden=true]"), box: box(b) } : null,
      };
    });
    // press the sound button: the name and icon should change
    const btn = page.locator("section[aria-labelledby=clip-title] button");
    if (await btn.count()) {
      await btn.click();
      await page.waitForTimeout(400);
      media.afterClick = await page.evaluate(() => {
        const b = document.querySelector("section[aria-labelledby=clip-title] button");
        const v = document.querySelector("section[aria-labelledby=clip-title] video");
        return { text: b.textContent.trim(), muted: v.muted, paths: b.querySelectorAll("svg path").length };
      });
      await btn.focus();
      await page.keyboard.press("Shift+Tab");
      await page.keyboard.press("Tab");
      await page.screenshot({ path: path.join(OUT, `${tag}-${w}-clip-sound-focus.jpg`), quality: 82 });
      await btn.click();
    }
    // the plates: section 01, and section 05 (Junior, the rover)
    await view("part-1", "#part-1");
    await view("part-5", "#part-5");
    media.plateLinks = await page.evaluate(() => [...document.querySelectorAll("section[id^=part-] figure a")].slice(0, 5).map((a) => ({
      name: a.getAttribute("aria-label"),
      line: (a.querySelector("span") && getComputedStyle(a.querySelector("span")).display) || null,
    })));
    await page.screenshot({ path: path.join(OUT, `${tag}-${w}-full.jpg`), fullPage: true, quality: 70 });
    report.push({ width: w, header: head, media, errors });
    await page.close();
  }
  await browser.close();
  console.log(JSON.stringify(report, null, 1));
})();

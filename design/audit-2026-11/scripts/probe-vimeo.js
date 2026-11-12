// Probe: does the Vimeo recording on /projects/5 play on the live site? (Locally the player answers 401.)
const { chromium } = require("C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright");
const path = require("path");
const LIVE = "https://alicepicco333." + "github.io/portfolio/projects/5/";
(async () => {
  const browser = await chromium.launch();
  for (const url of [LIVE, "http://127.0.0.1:3001/projects/5"]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const codes = [];
    page.on("response", (r) => r.url().includes("player.vimeo.com/video") && codes.push(r.status()));
    await page.goto(url, { waitUntil: "load", timeout: 120000 });
    const frame = page.locator("iframe[src*='vimeo']").first();
    await frame.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(6000);
    const text = await page.frames().filter((f) => f.url().includes("vimeo"))[0]?.evaluate(() => document.body.innerText.slice(0, 200)).catch((e) => "unreadable: " + e.message.slice(0, 80));
    console.log(url.includes("127.") ? "local" : "live", "| player status", codes.join(","), "| text:", JSON.stringify(text || ""));
    await frame.screenshot({ path: path.join(__dirname, "..", url.includes("127.") ? "vimeo-local.png" : "vimeo-live.png") }).catch(() => {});
    await page.close();
  }
  await browser.close();
})().catch((e) => { console.log("FAILED", e.message); process.exit(1); });

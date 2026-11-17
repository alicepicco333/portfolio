// Probe: the 3D Junior in Firefox (Alice's browser), with a fake camera and microphone and the prompt auto-accepted.
// Firefox has no speech recognition, so the start should offer the camera only and ask for nothing else.
// Playwright 1.65 matches the downloaded Firefox build (firefox-1572)
const { firefox } = require("C:/Users/awlic/.claude/jobs/8b5be970/tmp/node_modules/playwright");
const path = require("path");
(async () => {
  const browser = await firefox.launch({ firefoxUserPrefs: { "media.navigator.streams.fake": true, "media.navigator.permission.disabled": true } });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => {
    const md = navigator.mediaDevices;
    if (!md) return;
    const orig = md.getUserMedia.bind(md);
    window.__asked = [];
    md.getUserMedia = (c) => {
      window.__asked.push(JSON.stringify({ video: !!c.video, audio: !!c.audio }));
      return orig(c).catch((e) => { window.__asked.push("rejected: " + e.name); throw e; });
    };
  });
  const page = await ctx.newPage();
  const logs = [];
  page.on("pageerror", (e) => logs.push("pageerror: " + e.message.slice(0, 200)));
  await page.goto("http://127.0.0.1:3001/projects/18", { waitUntil: "load", timeout: 120000 });
  await page.getByRole("button", { name: /Load the 3D Junior/ }).click();
  const frame = await (await page.waitForSelector("iframe[src*='sim/junior']", { timeout: 30000 })).contentFrame();
  await frame.waitForSelector("#startbtn:not([disabled])", { timeout: 120000 });
  console.log("buttons:", JSON.stringify(await frame.evaluate(() => [document.getElementById("startbtn").textContent, document.getElementById("startplain").textContent, document.querySelector("#talkbtn span").textContent])));
  await frame.click("#startbtn");
  await page.waitForTimeout(20000);
  console.log("after start:", JSON.stringify(await frame.evaluate(() => ({
    asked: window.__asked,
    hand: document.getElementById("handbtn").getAttribute("aria-pressed"),
    camShown: !document.getElementById("handcam").hidden,
    said: document.getElementById("heard")?.textContent?.slice(0, 170),
  }))));
  await page.screenshot({ path: path.join(__dirname, "..", "fix-shots", "sim-firefox.png") });
  console.log("errors:", logs.length ? logs.join(" | ") : "none");
  await browser.close();
})().catch((e) => { console.log("FAILED", e.message); process.exit(1); });

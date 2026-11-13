// Probe: does the 3D Junior on /projects/18 ask for the camera and the microphone when it starts? Two runs with a fake
// camera and microphone: the visitor allows (prompt accepted) and the visitor refuses (no fake prompt, no grant).
// Logs what getUserMedia was asked for and what the simulation tells the visitor.
const { chromium } = require("C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright");
const path = require("path");
const OUT = path.join(__dirname, "..", "fix-shots");
const PW = "C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright";
(async () => {
  for (const allow of [true, false]) {
    const browser = await chromium.launch({ args: ["--use-fake-device-for-media-stream", ...(allow ? ["--use-fake-ui-for-media-stream"] : [])] });
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    if (allow) await ctx.grantPermissions(["camera", "microphone"], { origin: "http://127.0.0.1:3001" });
    await ctx.addInitScript(() => {
      const md = navigator.mediaDevices;
      if (!md) return;
      const orig = md.getUserMedia.bind(md);
      window.__asked = [];
      md.getUserMedia = (c) => {
        window.__asked.push(JSON.stringify({ video: !!c.video, audio: !!c.audio }));
        return orig(c).catch((e) => { window.__asked.push("rejected: " + e.name + " " + e.message); throw e; });
      };
    });
    const page = await ctx.newPage();
    const logs = [];
    page.on("pageerror", (e) => logs.push("pageerror: " + e.message.slice(0, 200)));
    page.on("console", (m) => m.type() === "error" && logs.push("error: " + m.text().slice(0, 160)));
    await page.goto("http://127.0.0.1:3001/projects/18", { waitUntil: "load", timeout: 120000 });
    await page.getByRole("button", { name: /Load the 3D Junior/ }).click();
    const frame = await (await page.waitForSelector("iframe[src*='sim/junior']", { timeout: 30000 })).contentFrame();
    await frame.waitForSelector("#startbtn:not([disabled])", { timeout: 90000 });
    console.log(allow ? "ALLOW" : "REFUSE", "| buttons:", JSON.stringify(await frame.evaluate(() => [document.getElementById("startbtn").textContent, document.getElementById("startplain").hidden ? "(plain hidden)" : document.getElementById("startplain").textContent])));
    await page.screenshot({ path: path.join(OUT, "sim-start.png") });
    await frame.click("#startbtn");
    await page.waitForTimeout(15000);
    const after = await frame.evaluate(() => ({
      asked: window.__asked,
      hand: document.getElementById("handbtn").getAttribute("aria-pressed"),
      camShown: !document.getElementById("handcam").hidden,
      label: document.getElementById("handlabel")?.textContent,
      said: document.getElementById("heard")?.textContent?.slice(0, 170),
    }));
    console.log("  after start:", JSON.stringify(after));
    await page.screenshot({ path: path.join(OUT, `sim-${allow ? "allowed" : "refused"}.png`) });
    console.log("  errors:", logs.length ? [...new Set(logs)].slice(0, 5).join(" | ") : "none");
    await browser.close();
  }
})().catch((e) => { console.log("FAILED", e.message); process.exit(1); });

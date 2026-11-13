// Check the audit fixes to the hero: the default skill after the entrance, the larger picture on a corner
// with links cut at its edge, the step tag on the open skill only, the narrow hero, the header rule.
const { chromium } = require("C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules/playwright");
const path = require("path");
const OUT = path.join(__dirname, "..", "fix-shots");
require("fs").mkdirSync(OUT, { recursive: true });
const BASE = "http://127.0.0.1:3001";
(async () => {
  const browser = await chromium.launch();
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 200)));
  await page.goto(BASE + "/", { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(3500);
  const rest = await page.evaluate(() => ({
    open: [...document.querySelectorAll("[data-skill][aria-pressed='true']")].map((g) => g.dataset.skill),
    tags: [...document.querySelectorAll(".map-cluster")].map((t) => t.textContent),
    picture: document.querySelector(".skill-screen img")?.getAttribute("src"),
    header: getComputedStyle(document.querySelector("header")).borderBottomColor,
  }));
  console.log("at rest:", JSON.stringify(rest));
  await page.screenshot({ path: path.join(OUT, "hero-1440-rest.png") });
  for (const name of ["Ethnography", "User research", "HCI", "Digital archives", "Ontologies", "UX design", "Interaction design", "Data visualization", "Visual design", "Speculative design", "Live coding"]) {
    await page.getByText(name, { exact: true }).first().hover();
    await page.waitForTimeout(1300);
    const tag = await page.evaluate(() => [...document.querySelectorAll(".map-cluster")].map((t) => t.textContent).join(","));
    // any text that sits on the picture (labels, project names, the step tag)
    const over = await page.evaluate(() => {
      const s = document.querySelector('.skill-screen[data-on="true"]');
      if (!s) return { size: "none", on: [] };
      const p = s.getBoundingClientRect();
      const on = [...document.querySelectorAll("#map svg text")].filter((t) => {
        const b = t.getBoundingClientRect();
        return b.width > 0 && b.left < p.right - 1 && b.right > p.left + 1 && b.top < p.bottom - 1 && b.bottom > p.top + 1;
      }).map((t) => t.textContent);
      return { size: Math.round(p.width) + "x" + Math.round(p.height), on };
    });
    console.log(name, "-> tag", tag, "| picture", over.size, "| text on it:", over.on.length ? over.on.join(", ") : "none");
    await page.screenshot({ path: path.join(OUT, `hero-1440-${name.replace(/ /g, "-")}.png`) });
  }
  await page.mouse.move(700, 880);
  await page.waitForTimeout(1200);
  console.log("after leaving:", await page.evaluate(() => [...document.querySelectorAll("[data-skill][aria-pressed='true']")].map((g) => g.dataset.skill).join(",")));
  await page.evaluate(() => scrollTo(0, 400));
  await page.waitForTimeout(500);
  console.log("header when scrolled:", await page.evaluate(() => getComputedStyle(document.querySelector("header")).borderBottomColor));
  for (const [w, h] of [[1024, 768], [390, 844]]) {
    const p = await browser.newPage({ viewport: { width: w, height: h } });
    await p.goto(BASE + "/", { waitUntil: "load", timeout: 120000 });
    await p.waitForTimeout(2000);
    await p.screenshot({ path: path.join(OUT, `hero-${w}.png`) });
    await p.close();
  }
  const pp = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await pp.goto(BASE + "/projects/12", { waitUntil: "load", timeout: 120000 });
  await pp.waitForTimeout(1500);
  console.log("method strip:", await pp.evaluate(() => [...document.querySelectorAll("p")].filter((p) => /Method/.test(p.querySelector(".sr-only")?.textContent || "")).slice(0, 2).map((p) => p.innerText.replace(/\s+/g, " ")).join(" | ")));
  console.log("errors:", errors.length ? [...new Set(errors)].join(" ; ") : "none");
  await browser.close();
})().catch((e) => { console.log("FAILED", e.message); process.exit(1); });

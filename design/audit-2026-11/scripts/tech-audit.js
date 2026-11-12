// Technical audit of the portfolio before deploy (12 Nov 2026): axe-core (WCAG 2.1 A/AA, plus best practice
// reported apart), failed requests, console and page errors, image and video weight per page, horizontal
// overflow on phones, a keyboard pass on the homepage, and a link check (internal and external).
// Usage: node tech-audit.js            (BASE defaults to the local dev server)
// No personal data in requests: links are checked with a plain project User-Agent, no logins, no forms sent.
const path = require("path");
const fs = require("fs");
const NM = "C:/Users/awlic/.claude/jobs/b08852a3/tmp/node_modules";
const { chromium } = require(path.join(NM, "playwright"));
const AXE = fs.readFileSync(path.join(NM, "axe-core", "axe.min.js"), "utf8");
const BASE = process.env.BASE || "http://127.0.0.1:3001";
const OUT = path.join(__dirname, "..", process.env.OUT || "tech-results.json"); // OUT=tech-results-after.json after fixes
const UA = "portfolio-link-check/1.0";

const ids = require(path.join(__dirname, "..", "..", "..", "data", "portfolio.json")).projects.map((p) => String(p.id));
const ROUTES = ["/", "/contact", "/resume", "/accessibility", "/no-such-page"].concat(ids.map((i) => "/projects/" + i));
// [route, viewport, mode] extra passes: phone width and the site's own dark and high-contrast modes
const EXTRA = [
  ["/", "phone", "light"], ["/projects/18", "phone", "light"], ["/projects/20", "phone", "light"], ["/projects/12", "phone", "light"],
  ["/", "desktop", "dark"], ["/projects/18", "desktop", "dark"], ["/", "desktop", "contrast"], ["/projects/12", "desktop", "contrast"],
];
const VIEW = { desktop: { width: 1440, height: 900 }, phone: { width: 390, height: 844 } };

async function audit(browser, route, view = "desktop", mode = "light") {
  const ctx = await browser.newContext({ viewport: VIEW[view], isMobile: view === "phone", hasTouch: view === "phone" });
  await ctx.addInitScript((m) => {
    try {
      localStorage.setItem("ap-theme", m === "dark" ? "dark" : "light");
      localStorage.setItem("ap-contrast", m === "contrast" ? "high" : "standard");
    } catch (e) {}
  }, mode);
  const page = await ctx.newPage();
  const r = { route, view, mode, failed: [], console: [], pageErrors: [], media: [] };
  page.on("response", (res) => {
    const u = res.url();
    if (res.status() >= 400 && !u.includes("/_next/webpack-hmr") && !(route === "/no-such-page" && u.endsWith(route))) r.failed.push(res.status() + " " + u.replace(BASE, ""));
  });
  page.on("requestfailed", (req) => {
    const f = req.failure() && req.failure().errorText;
    if (f && !/ERR_ABORTED/.test(f)) r.failed.push(f + " " + req.url().replace(BASE, ""));
  });
  page.on("console", (m) => m.type() === "error" && r.console.push(m.text().slice(0, 300)));
  page.on("pageerror", (e) => r.pageErrors.push(e.message.slice(0, 300)));
  const res = await page.goto(BASE + route, { waitUntil: "load", timeout: 120000 });
  r.status = res && res.status();
  await page.waitForTimeout(1500);
  const h = await page.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 600) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(120); }
  await page.waitForTimeout(1200);
  await page.evaluate(() => scrollTo(0, 0));
  Object.assign(r, await page.evaluate(() => {
    const vw = innerWidth;
    const wide = [...document.querySelectorAll("body *")].filter((el) => {
      const b = el.getBoundingClientRect();
      return b.width > 0 && b.right > vw + 1 && getComputedStyle(el).position !== "fixed";
    }).slice(0, 5).map((el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (el.className && typeof el.className === "string" ? "." + el.className.split(" ").slice(0, 2).join(".") : ""));
    const res = performance.getEntriesByType("resource");
    const media = res.filter((e) => /\.(jpe?g|png|webp|avif|gif|svg|mp4|webm)(\?|$)/i.test(e.name));
    return {
      title: document.title,
      lang: document.documentElement.lang,
      h1: [...document.querySelectorAll("h1")].map((e) => e.innerText.trim().slice(0, 80)),
      overflowX: document.documentElement.scrollWidth > vw + 1 ? document.documentElement.scrollWidth : 0,
      wide,
      mediaKB: Math.round(media.reduce((s, e) => s + (e.encodedBodySize || e.transferSize || 0), 0) / 1024),
      largest: media.sort((a, b) => (b.encodedBodySize || 0) - (a.encodedBodySize || 0)).slice(0, 3)
        .map((e) => Math.round((e.encodedBodySize || 0) / 1024) + " KB " + e.name.replace(location.origin, "")),
      videos: [...document.querySelectorAll("video")].map((v) => ({ src: (v.currentSrc || v.getAttribute("src") || "").replace(location.origin, ""), muted: v.muted, autoplay: v.autoplay, tracks: v.querySelectorAll("track").length, controls: v.controls })),
      links: [...document.querySelectorAll("a[href]")].map((a) => a.href).filter((u) => /^https?:/.test(u)),
    };
  }));
  await page.addScriptTag({ content: AXE });
  const axe = await page.evaluate(async () => {
    const out = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] }, resultTypes: ["violations"] });
    return out.violations.map((v) => ({
      id: v.id, impact: v.impact, wcag: v.tags.some((t) => /^wcag2(1)?a{1,2}$/.test(t)), help: v.help, count: v.nodes.length,
      targets: v.nodes.slice(0, 4).map((n) => n.target.join(" ") + (n.any[0] && n.any[0].message ? "  [" + n.any[0].message.slice(0, 140) + "]" : "")),
    }));
  });
  r.axe = axe;
  await ctx.close();
  return r;
}

async function keyboard(browser) {
  const ctx = await browser.newContext({ viewport: VIEW.desktop });
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "load", timeout: 120000 });
  await page.waitForTimeout(2500);
  const stops = [];
  for (let i = 0; i < 45; i++) {
    await page.keyboard.press("Tab");
    await page.waitForTimeout(80);
    stops.push(await page.evaluate(() => {
      const el = document.activeElement;
      if (!el || el === document.body) return { el: "body" };
      const cs = getComputedStyle(el), b = el.getBoundingClientRect();
      const ring = (cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0) || (cs.boxShadow && cs.boxShadow !== "none");
      return {
        el: el.tagName.toLowerCase() + (el.getAttribute("role") ? "[" + el.getAttribute("role") + "]" : ""),
        name: (el.getAttribute("aria-label") || el.innerText || el.getAttribute("title") || "").trim().replace(/\s+/g, " ").slice(0, 50),
        ring, visible: b.width > 0 && b.height > 0 && b.bottom > 0 && b.top < innerHeight + 2000 && cs.visibility !== "hidden" && cs.opacity !== "0",
      };
    }));
  }
  await ctx.close();
  return stops;
}

async function checkLinks(urls) {
  const out = [];
  for (const u of urls) {
    let status = "?";
    for (const method of ["HEAD", "GET"]) {
      try {
        const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 15000);
        const res = await fetch(u, { method, redirect: "follow", headers: { "User-Agent": UA }, signal: ac.signal });
        clearTimeout(t); status = res.status;
        if (status < 400 || method === "GET") break;
      } catch (e) { status = "error " + (e.name === "AbortError" ? "timeout" : e.message.slice(0, 60)); }
    }
    if (!(typeof status === "number" && status < 400)) out.push({ url: u, status });
  }
  return out;
}

(async () => {
  const browser = await chromium.launch();
  const results = [];
  for (const route of ROUTES) { results.push(await audit(browser, route)); console.log("audited", route); }
  for (const [route, view, mode] of EXTRA) { results.push(await audit(browser, route, view, mode)); console.log("audited", route, view, mode); }
  const keys = await keyboard(browser);
  await browser.close();
  const all = [...new Set(results.flatMap((r) => r.links))].filter((u) => !/^mailto:/.test(u));
  const internal = all.filter((u) => u.startsWith(BASE)).map((u) => u.split("#")[0]);
  const external = all.filter((u) => !u.startsWith(BASE));
  console.log("checking", new Set(internal).size, "internal and", external.length, "external links");
  const broken = await checkLinks([...new Set(internal)].concat(external));
  results.forEach((r) => delete r.links);
  fs.writeFileSync(OUT, JSON.stringify({ base: BASE, date: new Date().toISOString(), results, keyboard: keys, brokenLinks: broken, linksChecked: { internal: new Set(internal).size, external: external.length } }, null, 1));
  console.log("written", OUT);
})().catch((e) => { console.log("FAILED", e.stack); process.exit(1); });

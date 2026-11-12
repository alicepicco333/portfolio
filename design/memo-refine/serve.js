// A live preview of The Meme Ontology with the refine layer: every request is passed to the live site,
// and HTML pages get memo-refine.css as the last stylesheet and memo-refine.js (with findings.json in front
// of it) as the last script, all read from disk on each request, so edits show on reload.
// Nothing of the site is copied. Usage: node serve.js [port]   (default 5192)
const http = require("http");
const fs = require("fs");
const path = require("path");

const ORIGIN = "https://thememeontology.netlify.app";
const PORT = Number(process.argv[2]) || 5192;
const CSS = path.join(__dirname, "memo-refine.css");
const JS = path.join(__dirname, "memo-refine.js");
const FINDINGS = path.join(__dirname, "findings.json");
const UA = "memo-refine-preview"; // a project name only, no contact details

const server = http.createServer(async (req, res) => {
  try {
    if (req.url.split("?")[0] === "/__refine.css") {
      res.writeHead(200, { "Content-Type": "text/css; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(fs.readFileSync(CSS));
    }
    // the markup layer, with the draft findings in front of it (both read from disk on every request)
    if (req.url.split("?")[0] === "/__refine.js") {
      let findings = "null";
      try { findings = fs.readFileSync(FINDINGS, "utf8"); } catch (e) { /* no findings yet */ }
      res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8", "Cache-Control": "no-store" });
      return res.end(`window.MEMO_REFINE_FINDINGS = ${findings};\n` + fs.readFileSync(JS, "utf8"));
    }
    const upstream = await fetch(ORIGIN + req.url, { headers: { "User-Agent": UA }, redirect: "follow" });
    const type = upstream.headers.get("content-type") || "application/octet-stream";
    const body = Buffer.from(await upstream.arrayBuffer());
    if (type.includes("text/html")) {
      let html = body.toString("utf8");
      const link = '<link rel="stylesheet" href="/__refine.css"><script src="/__refine.js" defer></script>';
      // last in the cascade: after the site's own stylesheets and any inline style blocks
      html = html.includes("</body>") ? html.replace(/<\/body>(?![\s\S]*<\/body>)/, `${link}</body>`) : html + link;
      res.writeHead(upstream.status, { "Content-Type": type, "Cache-Control": "no-store" });
      return res.end(html);
    }
    res.writeHead(upstream.status, { "Content-Type": type });
    res.end(body);
  } catch (e) {
    res.writeHead(502, { "Content-Type": "text/plain" });
    res.end("Preview error: " + e.message);
  }
});
server.listen(PORT, "127.0.0.1", () => console.log(`Meme Ontology refine preview: http://127.0.0.1:${PORT}/`));

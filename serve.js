/* =============================================================================
   SmartPark — tiny static server (no dependencies)
       node serve.js            → http://127.0.0.1:8123/
       node serve.js 4000       → choose another port

   You do NOT need this to use SmartPark: the app is plain HTML/CSS/JS, so you
   can also just double-click index.html (or standalone.html). This server is
   handy when you want a normal http:// URL for the demo.
============================================================================= */
const http = require("http");
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const PORT = Number(process.argv[2]) || 8123;
const HOST = "127.0.0.1";
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png"
};

http.createServer(function (req, res) {
  let urlPath = decodeURIComponent(String(req.url).split("?")[0]);
  if (urlPath === "/") urlPath = "/index.html";

  const filePath = path.join(ROOT, urlPath);
  // keep requests inside this folder
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, { "content-type": "text/plain" });
    return res.end("403 Forbidden");
  }
  fs.readFile(filePath, function (err, data) {
    if (err) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      return res.end("404 Not found: " + urlPath);
    }
    // no-store so an edited css/js file is never served from the browser cache
    res.writeHead(200, {
      "content-type": MIME[path.extname(filePath)] || "application/octet-stream",
      "cache-control": "no-store"
    });
    res.end(data);
  });
}).listen(PORT, HOST, function () {
  console.log("SmartPark is running →  http://" + HOST + ":" + PORT + "/index.html");
  console.log("Press Ctrl+C to stop.");
});

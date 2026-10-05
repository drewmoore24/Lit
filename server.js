// Buzz server: serves the app and proxies BestTime so the API key stays private.
const http = require("http"), fs = require("fs"), path = require("path");
const KEY = process.env.BESTTIME_KEY, PORT = process.env.PORT || 3000;
const bars = JSON.parse(fs.readFileSync(path.join(__dirname, "bars.json")));
const page = () => fs.readFileSync(path.join(__dirname, "index.html"));
const cache = new Map(), TTL = 5 * 60 * 1000; // BestTime calls cost credits, so cache

async function busyness(bar) {
  const hit = cache.get(bar.id);
  if (hit && Date.now() - hit.t < TTL) return hit.data;
  const data = { live: null, forecast: null };
  try {
    const q = new URLSearchParams({ api_key_private: KEY, venue_name: bar.n, venue_address: bar.addr });
    const r = await fetch("https://besttime.app/api/v1/forecasts/now?" + q, { method: "POST" });
    const j = await r.json(), a = j.analysis || {};
    if (j.status === "OK") {
      data.live = a.venue_live_busyness_available ? a.venue_live_busyness : null;
      data.forecast = a.venue_forecasted_busyness ?? null;
    }
  } catch (e) { console.error(bar.n, e.message); }
  cache.set(bar.id, { t: Date.now(), data });
  return data;
}

http.createServer(async (req, res) => {
  const p = new URL(req.url, "http://x").pathname;
  const send = (code, type, body) => { res.writeHead(code, { "Content-Type": type }); res.end(body); };
  if (p === "/api/bars") return send(200, "application/json", JSON.stringify(bars));
  if (p === "/api/busyness") {
    if (!KEY) return send(200, "application/json", JSON.stringify({ source: "simulated", venues: {} }));
    const out = await Promise.all(bars.map(busyness)), venues = {};
    bars.forEach((b, i) => (venues[b.id] = out[i]));
    return send(200, "application/json", JSON.stringify({ source: "besttime", venues }));
  }
  send(200, "text/html; charset=utf-8", page());
}).listen(PORT, () => console.log("Buzz running at http://localhost:" + PORT + (KEY ? "" : " (no BESTTIME_KEY: simulated busyness)")));

# Buzz: busy bars in West Chester, PA

Run it (Node 18+, no dependencies):

    node server.js                          # simulated busyness
    BESTTIME_KEY=pri_xxx node server.js     # real busyness from BestTime

Open http://localhost:3000 (on a phone, use your computer's local IP, or deploy to Render/Railway/Fly).

- `server.js` serves the app and calls BestTime's `/forecasts/now` per bar, cached 5 minutes. The key never reaches the browser.
- Bars with no live reading fall back to BestTime's forecast, then to the simulation.
- `bars.json` holds the venues (name, address, coordinates, hours, tags). Add bars here.
- BestTime calls use credits. I couldn't open its docs while building, so check the `analysis` field names (`venue_live_busyness`, `venue_forecasted_busyness`, `venue_live_busyness_available`) in `server.js` against the current API reference.
- Map tiles are OpenStreetMap's public server, fine for development. Use a tile provider for production.

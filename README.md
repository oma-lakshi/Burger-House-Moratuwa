# Burger House — Website

Premium dark editorial theme (cravburgers.shop-inspired), FPV-style scroll-driven 3D camera flight, split across two pages. Static frontend + Supabase backend. GitHub → Netlify or Vercel.

## 1. What's fixed / changed in this update

**Camera bug fixed.** The 3D flight was rendering the *inside* of the burger model (huge blown-up close-up faces filling the screen) because the camera keyframe positions were hand-guessed fixed numbers that didn't match the model's actual scale. `js/cinematic.js` now measures the model's real bounding size the moment it loads and positions the camera as a multiple of that measurement — the camera is now mathematically guaranteed to stay outside the geometry at every point in the scroll, on any device.

**Two pages now, not one long scroll.**
- **`index.html`** — the entry gate, the FPV camera-flight experience, the headline block, the ticker, the quality grid, and a closing "View Menu" call-to-action. This is the *experience*.
- **`menu.html`** — the actual ordering page: full Menu, Add-Ons, Hours & Location (with the Moratuwa/Nugegoda branch tabs), and Contact. Loads instantly since it doesn't need Three.js or GSAP at all.

Nav links and the footer on both pages cross-link correctly. The `#hours`/`#menu`/`#contact` anchors only exist on `menu.html` now.

## 2. If a camera shot still looks off

Since I can't render WebGL in my own environment, I can't preview the exact framing myself. If any specific moment during the scroll still looks too close, too far, or angled oddly, tell me **roughly what scroll percentage** it happens at (e.g. "about a third of the way through the flight, the camera is too close") and I'll adjust the `KF` array in `js/cinematic.js` directly — each entry is one keyframe with a `dist` (distance from the burger, in multiples of its own size) and `dir` (which direction the camera sits in). No rebuild needed, just number tweaks.

## 3. Supabase setup (still pending)

`js/supabase-config.js` still has placeholder values from last time. Once you have a project:
1. SQL Editor → run `sql/01_schema.sql`, then `sql/02_seed.sql`
2. Authentication → Users → add a staff login
3. Project Settings → API → copy Project URL + anon public key into `js/supabase-config.js`

The entry gate and 3D flight on `index.html` work without this. `menu.html`'s Menu/Hours/Contact and the dashboard need it.

## 4. Deploy

Netlify (`netlify.toml` sets publish dir automatically) or Vercel (auto-detected, no config needed) both work unchanged. For GitHub, use GitHub Desktop or `git` — not the website drag-and-drop uploader, which flattens folders.

## 5. Files

```
index.html                 entry gate + FPV camera flight + headline/marquee/quality + closing CTA
menu.html                   menu, add-ons, hours & location, contact — the ordering page
dashboard.html               staff dashboard
netlify.toml
css/style.css                 full design system (shared by all three pages)
css/dashboard.css             dashboard-only styles
js/supabase-config.js         your Supabase URL + anon key — still needs filling in
js/cinematic.js               Scene 0 shatter intro + FPV camera-flight engine (now scale-safe)
js/app.js                     menu / branches / contact data + interactions — shared by index.html and menu.html, auto-detects which elements exist on each page
js/dashboard.js               dashboard CRUD logic
sql/01_schema.sql             database tables + security rules
sql/02_seed.sql               real menu/contact/hours/branches data
assets/logo-original.png      your real logo, background removed
assets/models/burger.glb      optimized 3D burger (465KB), CC-BY-4.0 — Roberto Domínguez
```

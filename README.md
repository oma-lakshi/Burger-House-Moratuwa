# Burger House — Website

Complete rebuild: no Three.js, no WebGL, no scroll-hijacking — just a fast, animated, dark-themed site using Tailwind CDN + Lucide icons + your real product photo. Static frontend + Supabase backend.

## 1. Why this version is different (and should finally not be laggy)

Every previous version's slowness or breakage traced back to real-time 3D rendering (WebGL camera math, skinned-mesh animation, or video-element scrubbing) — all inherently fragile and hard for me to debug without being able to run a browser myself. This version drops that approach entirely:

- **Loading screen**: a tiny (84KB) looping video of your walking-burger clip, muted, with a simple bottom progress bar. No 3D, no shatter/crack effect, dismisses itself automatically on a timer — it can never get stuck.
- **Hero & "floating" elements**: your actual burger photo (background removed) and a cropped onion-ring piece, animated with lightweight CSS `@keyframes` floats — no JavaScript animation loop, costs nothing to render.
- **"Sideways" scrolling**: the dish showcase is a native horizontally-scrollable strip (CSS scroll-snap) — smooth, works with touch/trackpad/mouse-wheel out of the box, no custom scroll-hijacking code to get wrong.

## 2. What's using your reference material

- **Theme**: dark mode with amber-gold glow accents, bold Outfit display type + DM Sans body, glassmorphism cards, bento-grid quality section — following the design-system spec you pasted.
- **Hero + floating garnish**: your uploaded burger photo, with the white background removed.
- **Loading screen**: your walking-burger video, compressed from 938KB → 84KB (stripped audio per your note, re-encoded smaller).
- **Horizontal dish showcase**: structurally inspired by the "Poco" theme demo and the Framer "Creatiq" template you shared (bold cards, pill CTAs, sideways motion) — built original, not copied, using your real menu items (Fried Rice, Nasi Goreng, Kottu, Dolphin, Submarine).
- **Research**: current (2026) restaurant-site design trends confirm the direction — dark mode for food brands, bold custom typography, and *fast-loading* micro-animations over heavy video/3D hero sections.

## 3. About the Cloudflare/security spec you pasted

That's a real, solid security architecture — but it's built for a site with its own backend server (Node/Python/PHP) handling auth. This site doesn't have one: it's a static site with Supabase handling auth directly from the browser, which already gives you bcrypt password hashing, session tokens, and row-level-security-enforced data access without any server of your own to run middleware on. Implementing literal Cloudflare Zero Trust + Argon2id + custom rate-limiting middleware isn't something I can wire into this architecture as-is.

If you want meaningfully better dashboard login security within this stack, the realistic options are: (1) enable Supabase's built-in rate limiting and email confirmation settings (a dashboard toggle, not code), or (2) add a Cloudflare Turnstile widget to the login form itself as a bot-check. Say the word and I'll add whichever one you want — just flagging that the full spec as written doesn't fit a static+Supabase site.

## 4. Supabase setup (still pending)

`js/supabase-config.js` still has placeholder values. Once you have a project:
1. SQL Editor → run `sql/01_schema.sql`, then `sql/02_seed.sql`
2. Authentication → Users → add a staff login
3. Project Settings → API → copy Project URL + anon public key into `js/supabase-config.js`

The homepage works fully without this. `menu.html`'s live menu/hours/contact and the dashboard need it.

## 5. Deploy

Netlify or Vercel, both unchanged — no build step. Use GitHub Desktop or `git` to push, not the website drag-and-drop uploader.

## 6. Files

```
index.html                 homepage — loading screen, hero, horizontal dishes, bento grid, closing CTA
menu.html                   full menu, add-ons, hours & location, contact
dashboard.html               staff dashboard
netlify.toml
css/custom.css                shared design tokens + components (nav, buttons, menu/hours/contact, footer)
css/dashboard.css             dashboard-only styles
js/supabase-config.js         your Supabase URL + anon key — still needs filling in
js/app.js                     menu / branches / contact data + interactions + loading screen removed from here (now inline in index.html for reliability)
js/dashboard.js               dashboard CRUD logic
sql/01_schema.sql             database tables + security rules
sql/02_seed.sql               real menu/contact/hours/branches data
assets/logo-original.png      your real logo, background removed
assets/hero/burger-hero.webp  your burger photo, background removed, compressed
assets/hero/onion-float.webp  cropped floating garnish accent
assets/loading/burger-walk.mp4  your walking-burger clip, compressed, no audio
```

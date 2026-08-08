# Burger House — Website

Premium dark editorial theme (cravburgers.shop-inspired), scroll-driven hero split across two pages. Static frontend + Supabase backend. GitHub → Netlify or Vercel.

## 1. What's fixed / changed in this update

**The 3D model is gone — the hero is now your real burger video, scrubbed frame by frame.** Playing an actual `<video>` tied to scroll was the source of the lag (browsers aren't built to seek video frame-accurately on every scroll tick). Instead, `Burger_video.mp4` was cut into 120 individual JPG frames (`assets/frames/frame_0001.jpg` … `frame_0120.jpg`, 854×480, ~4.3MB total) that all preload up front. While you scroll through the hero, `js/cinematic.js` just picks the right frame for the current scroll position and draws it straight to a `<canvas>` — no video decoding or seeking happens during scroll at all, so it stays smooth even on modest phones. The source `Burger_video.mp4` itself isn't needed on the deployed site — it was only used once, locally, to generate the frame set.

**Shop details now show up during that first scroll, too.** Alongside the existing "Stacked. Grilled. / Devoured." captions, a centered panel now appears partway through the hero with the hours and both branch names, before the finale logo/CTA. Same reveal system as before (`OVERLAYS` array in `js/cinematic.js`, tied to scroll progress 0–1).

**A proper transition out of the hero.** In the last ~10% of the hero's scroll, a dark veil now fades in over the frame (`#cine-fade-veil`) right as the finale CTA appears, so it settles to black before the pin releases into "THE BURGER SMASHED FRESH" headline section below, instead of cutting straight across.

**The watermark on the video is hidden by the WhatsApp button — precisely, not just eyeballed.** The clip has a small star watermark, bottom-right. Rather than nail down one fixed pixel offset (which would drift off-mark the moment the video is cropped differently on a wider or narrower screen), the WhatsApp button's position is now computed every frame with the exact same "cover" math used to draw the video itself, so it locks onto the watermark's real on-screen position at any window size. It also briefly stops its usual bob/pulse animation while doing this, so it sits dead still over the mark instead of wobbling off it. Once you scroll past the hero (or on `menu.html`, which never shows the video), it's back to its normal spot floating bottom-right.

**The WhatsApp button now actually works out of the box.** Previously its link only ever got set from Supabase's `settings.whatsapp_shop` — with Supabase still unconfigured (see §3), that code path never ran, so the button sat at `href="#"` and did nothing when clicked. It now gets a real working link immediately on page load; your dashboard's WhatsApp number will still override it automatically once Supabase is connected.

**The loading screen now launches itself.** It no longer waits for you to scroll, tap, or press a key. It shows the ring/percentage loader for at least ~1 second (even if everything's cached and loads instantly), then automatically plays a crack-and-flash transition — hairline cracks race out from the center, then a bright burst of light blows through them — before the debris flies apart and the site opens straight into the hero, ready to scroll.

## 2. If a scroll moment still looks off

Since I can't play video/scroll in my own environment, I can't preview the exact framing myself. Two things you can adjust directly in `js/cinematic.js`:
- **Which frame shows at which scroll point** — it's a straight 0–1 mapping across all 120 frames, so this should already track the footage evenly. If you want a different pace, adjust the maths in `updateScene()`.
- **When the caption panels appear** — edit the `OVERLAYS` array (each row is `[selector, startProgress, endProgress]`, both 0–1).

If you ever swap in a different clip, drop the new file in as `Burger_video.mp4`-equivalent and let me know — I'll re-cut the frame sequence and update `FRAME_COUNT` to match.

## 3. Supabase setup (still pending)

`js/supabase-config.js` still has placeholder values from last time. Once you have a project:
1. SQL Editor → run `sql/01_schema.sql`, then `sql/02_seed.sql`
2. Authentication → Users → add a staff login
3. Project Settings → API → copy Project URL + anon public key into `js/supabase-config.js`

The entry gate and hero on `index.html` work without this (and the WhatsApp button now works without it too — see §1). `menu.html`'s Menu/Hours/Contact and the dashboard still need it.

## 4. Deploy

Netlify (`netlify.toml` sets publish dir automatically) or Vercel (auto-detected, no config needed) both work unchanged. For GitHub, use GitHub Desktop or `git` — not the website drag-and-drop uploader, which flattens folders.

## 5. Files

```
index.html                 entry gate + frame-sequence hero + headline/marquee/quality + closing CTA
menu.html                   menu, add-ons, hours & location, contact — the ordering page
dashboard.html               staff dashboard
netlify.toml
css/style.css                 full design system (shared by all three pages)
css/dashboard.css             dashboard-only styles
js/supabase-config.js         your Supabase URL + anon key — still needs filling in
js/cinematic.js               Scene 0 crack/light-burst intro (auto-launches) + scroll-driven frame-sequence hero
js/app.js                     menu / branches / contact data + interactions — shared by index.html and menu.html, auto-detects which elements exist on each page
js/dashboard.js               dashboard CRUD logic
sql/01_schema.sql             database tables + security rules
sql/02_seed.sql               real menu/contact/hours/branches data
assets/logo-original.png      your real logo, background removed
assets/frames/frame_0001.jpg…frame_0120.jpg   the hero video, pre-cut into a 120-frame JPG sequence (~4.3MB total)
assets/models/burger.glb      no longer used by the site — kept here in case you want it back; safe to delete
```

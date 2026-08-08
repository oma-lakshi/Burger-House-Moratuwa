/* ============================================================
   BURGER HOUSE — app.js
   Handles: menu, branches, contact/social wiring, add-ons, reveals.
   Runs independently of cinematic.js (which owns the entry gate + 3D flight).
   ============================================================ */
let sb = null;
try {
  sb = window.supabase.createClient(window.BH_SUPABASE_URL, window.BH_SUPABASE_ANON_KEY);
} catch (err) {
  console.warn('Burger House: Supabase not configured yet — see README.md Section 1.', err);
}

/* ---------- NAV ---------- */
const nav = document.getElementById('site-nav');
document.getElementById('nav-toggle').addEventListener('click', () => nav.classList.toggle('open'));
nav.querySelectorAll('.nav-links a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));

/* ---------- BUTTON PRESS MICRO-INTERACTION ---------- */
document.addEventListener('pointerdown', (e) => { const btn = e.target.closest('.btn'); if (btn) btn.classList.add('pressed'); });
document.addEventListener('pointerup', () => document.querySelectorAll('.btn.pressed').forEach(b => b.classList.remove('pressed')));

/* ---------- SCROLL REVEAL ---------- */
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('in'); revealObserver.unobserve(entry.target); } });
}, { threshold: 0.15 });
function observeReveals(root=document){ root.querySelectorAll('.reveal:not(.in)').forEach(el => revealObserver.observe(el)); }

/* ---------- HELPERS ---------- */
function money(n){ if (n === null || n === undefined) return null; return Number(n).toLocaleString('en-LK'); }
function escapeHtml(str){ if (!str) return ''; return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function waLink(number, text){ const digits = number.replace(/[^\d]/g, ''); return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`; }

/* ---------- WHATSAPP DEFAULT (works even before/without Supabase) ---------- */
// The float/card links used to stay at href="#" until Supabase settings loaded,
// so on a page without Supabase configured, clicking it did nothing. Give it a
// real link right away; renderSettings() below will overwrite it with the live
// dashboard number once/if Supabase settings load.
const DEFAULT_WA_NUMBER = '+94772299827';
(function applyDefaultWaLink(){
  const link = waLink(DEFAULT_WA_NUMBER, "Hi Burger House! I'd like to place an order.");
  const waFloat = document.getElementById('wa-float-shop');
  const waCard = document.getElementById('wa-shop-card');
  if (waFloat) waFloat.href = link;
  if (waCard) waCard.href = link;
})();

/* ---------- RENDER: SETTINGS-DRIVEN CONTACT ---------- */
function renderSettings(s){
  document.querySelectorAll('[data-order-btn]').forEach(el => el.href = s.ubereats_store_link);
  document.querySelectorAll('[data-call-btn]').forEach(el => el.href = `tel:${s.phone}`);
  document.querySelectorAll('[data-phone-text]').forEach(el => el.textContent = s.phone);

  const waFloat = document.getElementById('wa-float-shop');
  if (s.whatsapp_shop) {
    const link = waLink(s.whatsapp_shop, "Hi Burger House! I'd like to place an order.");
    document.getElementById('wa-shop-card').href = link;
    document.getElementById('wa-shop-card').closest('.contact-card').style.display = '';
    waFloat.href = link; waFloat.style.display = '';
  } else {
    document.getElementById('wa-shop-card').closest('.contact-card').style.display = 'none';
    waFloat.style.display = 'none';
  }

  setSocial('instagram', s.instagram_link);
  setSocial('tiktok', s.tiktok_link);
  setSocial('facebook', s.facebook_link);

  window.__BH_GLOBAL_HOURS = s.hours;
}
function setSocial(kind, url){
  document.querySelectorAll(`[data-social="${kind}"]`).forEach(el => {
    if (url) { el.href = url; el.style.display = ''; } else { el.style.display = 'none'; }
  });
}

/* ---------- RENDER: BRANCHES ---------- */
let BRANCHES = [];
function renderBranches(branches){
  const tabs = document.getElementById('branch-tabs');
  if (!tabs) return;
  BRANCHES = branches;
  tabs.innerHTML = branches.map((b,i) => `<button class="branch-tab ${i===0?'active':''}" data-idx="${i}">${escapeHtml(b.name)}</button>`).join('');
  tabs.querySelectorAll('.branch-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.querySelectorAll('.branch-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      showBranch(Number(btn.dataset.idx));
    });
  });
  if (branches.length) showBranch(0);
}
function showBranch(idx){
  const b = BRANCHES[idx];
  if (!b) return;
  const addrEl = document.getElementById('branch-address');
  const mapEl = document.getElementById('map-iframe');
  const hoursEl = document.getElementById('hours-body');
  if (addrEl) addrEl.textContent = b.address;
  if (mapEl) mapEl.src = `https://www.google.com/maps?q=${b.lat},${b.lng}&z=16&output=embed`;
  document.querySelectorAll('[data-directions-btn]').forEach(el => el.href = b.maps_link);

  if (!hoursEl) return;
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
  const todayIdx = (new Date().getDay() + 6) % 7;
  const hours = b.hours || window.__BH_GLOBAL_HOURS || {};
  hoursEl.innerHTML = days.map((d,i) => `
    <tr class="${i===todayIdx ? 'today':''}"><td>${d}${i===todayIdx?' (Today)':''}</td><td>${escapeHtml(hours[d] || '—')}</td></tr>
  `).join('');
}

/* ---------- RENDER: MENU ---------- */
let ALL_ITEMS = [], ALL_CATS = [], UBEREATS_STORE = '';

function renderMenuTabs(cats){
  const tabs = document.getElementById('menu-tabs');
  if (!tabs) return;
  tabs.innerHTML = `<button class="menu-tab active" data-cat="all">All</button>` + cats.map(c => `<button class="menu-tab" data-cat="${c.id}">${escapeHtml(c.name)}</button>`).join('');
  tabs.querySelectorAll('.menu-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      tabs.querySelectorAll('.menu-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderMenuGrid(btn.dataset.cat);
    });
  });
}
function itemCardHtml(item, catName){
  const link = item.ubereats_item_link || UBEREATS_STORE;
  let priceHtml;
  if (item.price_normal && item.price_full) {
    priceHtml = `<div class="sizes"><div><div>Rs ${money(item.price_normal)}</div><small>2 Person</small></div><div><div>Rs ${money(item.price_full)}</div><small>3 Person</small></div></div>`;
  } else if (item.price_normal) {
    priceHtml = `<div>Rs ${money(item.price_normal)}</div>`;
  } else {
    priceHtml = `<div>${escapeHtml(item.price_note || 'Ask staff')}</div>`;
  }
  return `
    <div class="menu-card reveal" data-cat="${item.category_id}">
      <div class="menu-card-top">
        <h3>${escapeHtml(item.name)}</h3>
        ${item.tag ? `<span class="tag-pill">${escapeHtml(item.tag)}</span>` : ''}
      </div>
      ${item.description ? `<p class="desc">${escapeHtml(item.description)}</p>` : `<p class="desc">${escapeHtml(catName)}</p>`}
      <div class="price-row">${priceHtml}</div>
      <a class="btn btn-sm order-btn" href="${link}" target="_blank" rel="noopener">Order on Uber Eats</a>
    </div>`;
}
function renderMenuGrid(filter='all'){
  const grid = document.getElementById('menu-grid');
  if (!grid) return;
  const catMap = Object.fromEntries(ALL_CATS.map(c => [c.id, c.name]));
  const items = filter === 'all' ? ALL_ITEMS : ALL_ITEMS.filter(i => i.category_id === filter);
  grid.innerHTML = items.map(i => itemCardHtml(i, catMap[i.category_id] || '')).join('');
  observeReveals(grid);
}
function renderAddons(addons){
  const el = document.getElementById('addons-list');
  if (!el) return;
  el.innerHTML = addons.map(a => `<div><span>${escapeHtml(a.name)}</span><span>Rs ${money(a.price)}/-</span></div>`).join('');
}

/* ---------- LOAD ALL DATA ---------- */
async function loadEverything(){
  const menuGrid = document.getElementById('menu-grid');
  if (!sb) {
    if (menuGrid) menuGrid.innerHTML = `<p style="font-family:var(--font-data);font-size:18px;">Menu data isn't connected yet — finish the Supabase setup in README.md, then refresh.</p>`;
    observeReveals();
    return;
  }
  try {
    const [{ data: settings }, { data: branches }, { data: cats }, { data: items }, { data: addons }] = await Promise.all([
      sb.from('settings').select('*').eq('id',1).single(),
      sb.from('branches').select('*').eq('active', true).order('sort_order'),
      sb.from('categories').select('*').eq('active', true).order('sort_order'),
      sb.from('menu_items').select('*').eq('active', true).order('sort_order'),
      sb.from('addons').select('*').eq('active', true).order('sort_order'),
    ]);

    if (settings) { UBEREATS_STORE = settings.ubereats_store_link; renderSettings(settings); }
    if (branches && branches.length) renderBranches(branches);
    if (cats) { ALL_CATS = cats; renderMenuTabs(cats); }
    if (items) { ALL_ITEMS = items; renderMenuGrid('all'); }
    if (addons) renderAddons(addons);
  } catch (err) {
    console.error('Burger House: no live Supabase data yet.', err);
    if (menuGrid) menuGrid.innerHTML = `<p style="font-family:var(--font-data);font-size:18px;">Menu data isn't connected yet — finish the Supabase setup in the README, then refresh.</p>`;
  } finally {
    observeReveals();
  }
}
loadEverything();

/* ---------- FOOTER WHATSAPP CREDIT (fixed, no editing needed) ---------- */
document.getElementById('credit-wa').href = waLink('+94774750576', "Hi Omesh! I found your work on the Burger House website.");

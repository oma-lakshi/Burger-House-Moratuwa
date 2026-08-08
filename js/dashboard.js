/* ============================================================
   BURGER HOUSE — dashboard.js
   ============================================================ */
let sb = null;
try {
  sb = window.supabase.createClient(window.BH_SUPABASE_URL, window.BH_SUPABASE_ANON_KEY);
} catch (err) {
  document.getElementById('login-error').textContent = 'Supabase isn\'t configured yet — see README.md Section 1, then refresh this page.';
}
const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

function toast(msg, isErr=false){
  const t = document.getElementById('dash-toast');
  t.textContent = msg;
  t.classList.toggle('err', isErr);
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2600);
}
function escapeHtml(str){
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function fd(form){
  const obj = {};
  new FormData(form).forEach((v,k) => obj[k] = v);
  return obj;
}

/* ============================================================
   AUTH
   ============================================================ */
async function checkSession(){
  if (!sb) { showLogin(); return; }
  const { data: { session } } = await sb.auth.getSession();
  if (session) { showDashboard(session); } else { showLogin(); }
}
function showLogin(){
  document.getElementById('login-wrap').style.display = 'flex';
  document.getElementById('dash-shell').style.display = 'none';
}
function showDashboard(session){
  document.getElementById('login-wrap').style.display = 'none';
  document.getElementById('dash-shell').style.display = 'flex';
  document.getElementById('dash-user-email').textContent = session.user.email;
  loadAll();
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('login-error');
  if (!sb) { errEl.textContent = 'Supabase isn\'t configured yet — see README.md Section 1.'; return; }
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  errEl.textContent = '';
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) { errEl.textContent = error.message; return; }
  showDashboard(data.session);
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  await sb.auth.signOut();
  showLogin();
});

/* ============================================================
   NAV PANELS
   ============================================================ */
document.querySelectorAll('.dash-nav-btn[data-panel]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.dash-nav-btn[data-panel]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.dash-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(btn.dataset.panel).classList.add('active');
  });
});

/* ============================================================
   LOAD EVERYTHING
   ============================================================ */
let CATS_CACHE = [];

async function loadAll(){
  await Promise.all([loadSettings(), loadBanners(), loadBranches(), loadCategories(), loadAddons()]);
  await loadItems(); // depends on categories cache
}

/* ---------- BRANCHES ---------- */
async function loadBranches(){
  const { data, error } = await sb.from('branches').select('*').order('sort_order');
  if (error) { toast('Could not load branches: ' + error.message, true); return; }
  const list = document.getElementById('branches-list');
  list.innerHTML = data.map(b => `
    <div class="card" data-id="${b.id}">
      <div class="card-row">
        <div style="flex:1;">
          <div class="grid-2">
            <div class="field"><label>Branch Name</label><input data-f="name" value="${escapeHtml(b.name)}"></div>
            <div class="field"><label>Sort Order</label><input data-f="sort_order" data-num="1" type="number" value="${b.sort_order}"></div>
          </div>
          <div class="field"><label>Address</label><input data-f="address" value="${escapeHtml(b.address)}"></div>
          <div class="field"><label>Google Maps Share Link</label><input data-f="maps_link" value="${escapeHtml(b.maps_link)}"></div>
          <div class="grid-2">
            <div class="field"><label>Latitude</label><input data-f="lat" data-num="1" type="number" step="any" value="${b.lat}"></div>
            <div class="field"><label>Longitude</label><input data-f="lng" data-num="1" type="number" step="any" value="${b.lng}"></div>
          </div>
        </div>
        <div class="card-actions">
          <button class="icon-btn save-btn">Save</button>
          <button class="icon-btn danger del-btn">Delete</button>
        </div>
      </div>
    </div>`).join('') || '<p class="hint">No branches yet — add one below.</p>';

  list.querySelectorAll('.card').forEach(card => {
    const id = card.dataset.id;
    card.querySelector('.save-btn').addEventListener('click', async () => {
      const payload = {};
      card.querySelectorAll('[data-f]').forEach(el => payload[el.dataset.f] = el.dataset.num ? Number(el.value) : el.value);
      const { error } = await sb.from('branches').update(payload).eq('id', id);
      if (error) toast('Save failed: ' + error.message, true); else toast('Branch saved.');
    });
    card.querySelector('.del-btn').addEventListener('click', () => deleteRow('branches', id, loadBranches));
  });
}
document.getElementById('branch-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = fd(e.target);
  payload.sort_order = Number(payload.sort_order || 0);
  payload.lat = Number(payload.lat);
  payload.lng = Number(payload.lng);
  const { error } = await sb.from('branches').insert(payload);
  if (error) toast('Add failed: ' + error.message, true);
  else { toast('Branch added.'); e.target.reset(); loadBranches(); }
});

/* ---------- SETTINGS ---------- */
const settingsForm = document.getElementById('settings-form');
async function loadSettings(){
  const { data, error } = await sb.from('settings').select('*').eq('id',1).single();
  if (error) { toast('Could not load settings: ' + error.message, true); return; }
  Object.entries(data).forEach(([k,v]) => {
    const el = settingsForm.elements[k];
    if (el && v !== null && v !== undefined && k !== 'hours') el.value = v;
  });
  const hoursEditor = document.getElementById('hours-editor');
  hoursEditor.innerHTML = DAYS.map(d => `
    <div class="field">
      <label>${d}</label>
      <input data-hour-day="${d}" value="${escapeHtml((data.hours && data.hours[d]) || '')}" placeholder="8AM–1AM">
    </div>`).join('');
}
settingsForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = fd(settingsForm);
  const hours = {};
  document.querySelectorAll('[data-hour-day]').forEach(el => hours[el.dataset.hourDay] = el.value);
  payload.hours = hours;
  if (payload.maps_lat) payload.maps_lat = parseFloat(payload.maps_lat); else delete payload.maps_lat;
  if (payload.maps_lng) payload.maps_lng = parseFloat(payload.maps_lng); else delete payload.maps_lng;
  const { error } = await sb.from('settings').update(payload).eq('id',1);
  if (error) toast('Save failed: ' + error.message, true);
  else toast('Saved — live site updated.');
});

/* ---------- GENERIC SIMPLE-TABLE HELPERS (banners / categories / addons) ---------- */
async function deleteRow(table, id, reload){
  if (!confirm('Delete this? This cannot be undone.')) return;
  const { error } = await sb.from(table).delete().eq('id', id);
  if (error) toast('Delete failed: ' + error.message, true);
  else { toast('Deleted.'); reload(); }
}

/* ---------- BANNERS ---------- */
async function loadBanners(){
  const { data, error } = await sb.from('banners').select('*').order('sort_order');
  if (error) { toast('Could not load banners: ' + error.message, true); return; }
  const list = document.getElementById('banners-list');
  list.innerHTML = data.map(b => `
    <div class="card" data-id="${b.id}">
      <div class="card-row">
        <div style="flex:1;">
          <div class="field"><label>Tag Label</label><input data-f="tag_label" value="${escapeHtml(b.tag_label||'')}"></div>
          <div class="field"><label>Title</label><input data-f="title" value="${escapeHtml(b.title)}"></div>
          <div class="field"><label>Subtitle</label><input data-f="subtitle" value="${escapeHtml(b.subtitle||'')}"></div>
          <div class="field"><label>Image URL</label><input data-f="image_url" value="${escapeHtml(b.image_url||'')}"></div>
          <div class="field"><label>Sort Order</label><input data-f="sort_order" type="number" value="${b.sort_order}"></div>
        </div>
        <div class="card-actions">
          <button class="icon-btn save-btn">Save</button>
          <button class="icon-btn danger del-btn">Delete</button>
        </div>
      </div>
    </div>`).join('') || '<p class="hint">No banners yet — add one below.</p>';

  list.querySelectorAll('.card').forEach(card => {
    const id = card.dataset.id;
    card.querySelector('.save-btn').addEventListener('click', async () => {
      const payload = {};
      card.querySelectorAll('[data-f]').forEach(el => payload[el.dataset.f] = el.type==='number' ? Number(el.value) : el.value);
      const { error } = await sb.from('banners').update(payload).eq('id', id);
      if (error) toast('Save failed: ' + error.message, true); else toast('Banner saved.');
    });
    card.querySelector('.del-btn').addEventListener('click', () => deleteRow('banners', id, loadBanners));
  });
}
document.getElementById('banner-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = fd(e.target);
  payload.sort_order = Number(payload.sort_order || 0);
  const { error } = await sb.from('banners').insert(payload);
  if (error) toast('Add failed: ' + error.message, true);
  else { toast('Banner added.'); e.target.reset(); loadBanners(); }
});

/* ---------- CATEGORIES ---------- */
async function loadCategories(){
  const { data, error } = await sb.from('categories').select('*').order('sort_order');
  if (error) { toast('Could not load categories: ' + error.message, true); return; }
  CATS_CACHE = data;
  const list = document.getElementById('categories-list');
  list.innerHTML = data.map(c => `
    <div class="card" data-id="${c.id}">
      <div class="card-row">
        <div style="flex:1;">
          <div class="grid-2">
            <div class="field"><label>Name</label><input data-f="name" value="${escapeHtml(c.name)}"></div>
            <div class="field"><label>Sort Order</label><input data-f="sort_order" type="number" value="${c.sort_order}"></div>
          </div>
          <div class="field"><label>Note</label><input data-f="note" value="${escapeHtml(c.note||'')}"></div>
        </div>
        <div class="card-actions">
          <button class="icon-btn save-btn">Save</button>
          <button class="icon-btn danger del-btn">Delete</button>
        </div>
      </div>
    </div>`).join('') || '<p class="hint">No categories yet — add one below.</p>';

  list.querySelectorAll('.card').forEach(card => {
    const id = card.dataset.id;
    card.querySelector('.save-btn').addEventListener('click', async () => {
      const payload = {};
      card.querySelectorAll('[data-f]').forEach(el => payload[el.dataset.f] = el.type==='number' ? Number(el.value) : el.value);
      const { error } = await sb.from('categories').update(payload).eq('id', id);
      if (error) toast('Save failed: ' + error.message, true); else { toast('Category saved.'); loadCategories(); }
    });
    card.querySelector('.del-btn').addEventListener('click', () => deleteRow('categories', id, () => { loadCategories(); loadItems(); }));
  });

  // populate selects
  const opts = data.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
  document.getElementById('item-category-select').innerHTML = opts;
  document.getElementById('items-filter').innerHTML = `<option value="all">All Categories</option>` + opts;
}
document.getElementById('category-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = fd(e.target);
  payload.sort_order = Number(payload.sort_order || 0);
  const { error } = await sb.from('categories').insert(payload);
  if (error) toast('Add failed: ' + error.message, true);
  else { toast('Category added.'); e.target.reset(); loadCategories(); }
});

/* ---------- MENU ITEMS ---------- */
async function loadItems(){
  const filter = document.getElementById('items-filter').value || 'all';
  let q = sb.from('menu_items').select('*').order('sort_order');
  if (filter !== 'all') q = q.eq('category_id', filter);
  const { data, error } = await q;
  if (error) { toast('Could not load items: ' + error.message, true); return; }
  const catMap = Object.fromEntries(CATS_CACHE.map(c => [c.id, c.name]));
  const list = document.getElementById('items-list');
  list.innerHTML = data.map(i => `
    <div class="card" data-id="${i.id}">
      <div class="card-row">
        <div style="flex:1;">
          <div class="grid-3">
            <div class="field"><label>Name</label><input data-f="name" value="${escapeHtml(i.name)}"></div>
            <div class="field"><label>Category</label>
              <select data-f="category_id">${CATS_CACHE.map(c => `<option value="${c.id}" ${c.id===i.category_id?'selected':''}>${escapeHtml(c.name)}</option>`).join('')}</select>
            </div>
            <div class="field"><label>Tag</label><input data-f="tag" value="${escapeHtml(i.tag||'')}"></div>
          </div>
          <div class="field"><label>Description</label><input data-f="description" value="${escapeHtml(i.description||'')}"></div>
          <div class="grid-3">
            <div class="field"><label>Price Normal/2P</label><input data-f="price_normal" data-num="1" type="number" step="0.01" value="${i.price_normal ?? ''}"></div>
            <div class="field"><label>Price Full/3P</label><input data-f="price_full" data-num="1" type="number" step="0.01" value="${i.price_full ?? ''}"></div>
            <div class="field"><label>Price Note</label><input data-f="price_note" value="${escapeHtml(i.price_note||'')}"></div>
          </div>
          <div class="field"><label>Uber Eats item link (optional)</label><input data-f="ubereats_item_link" value="${escapeHtml(i.ubereats_item_link||'')}"></div>
          <label style="font-size:12px;display:flex;gap:6px;align-items:center;"><input type="checkbox" data-f="active" data-bool="1" ${i.active?'checked':''}> Active (visible on site)</label>
        </div>
        <div class="card-actions">
          <button class="icon-btn save-btn">Save</button>
          <button class="icon-btn danger del-btn">Delete</button>
        </div>
      </div>
    </div>`).join('') || '<p class="hint">No items in this category yet.</p>';

  list.querySelectorAll('.card').forEach(card => {
    const id = card.dataset.id;
    card.querySelector('.save-btn').addEventListener('click', async () => {
      const payload = {};
      card.querySelectorAll('[data-f]').forEach(el => {
        if (el.dataset.bool) payload[el.dataset.f] = el.checked;
        else if (el.dataset.num) payload[el.dataset.f] = el.value === '' ? null : Number(el.value);
        else payload[el.dataset.f] = el.value;
      });
      const { error } = await sb.from('menu_items').update(payload).eq('id', id);
      if (error) toast('Save failed: ' + error.message, true); else toast('Item saved.');
    });
    card.querySelector('.del-btn').addEventListener('click', () => deleteRow('menu_items', id, loadItems));
  });
}
document.getElementById('items-filter').addEventListener('change', loadItems);
document.getElementById('item-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = fd(e.target);
  if (payload.price_normal === '') delete payload.price_normal; else payload.price_normal = Number(payload.price_normal);
  if (payload.price_full === '') delete payload.price_full; else payload.price_full = Number(payload.price_full);
  const { error } = await sb.from('menu_items').insert(payload);
  if (error) toast('Add failed: ' + error.message, true);
  else { toast('Item added.'); e.target.reset(); loadItems(); }
});

/* ---------- ADDONS ---------- */
async function loadAddons(){
  const { data, error } = await sb.from('addons').select('*').order('sort_order');
  if (error) { toast('Could not load add-ons: ' + error.message, true); return; }
  const list = document.getElementById('addons-list-dash');
  list.innerHTML = data.map(a => `
    <div class="card" data-id="${a.id}">
      <div class="card-row">
        <div style="flex:1;">
          <div class="grid-2">
            <div class="field"><label>Name</label><input data-f="name" value="${escapeHtml(a.name)}"></div>
            <div class="field"><label>Price (Rs)</label><input data-f="price" data-num="1" type="number" step="0.01" value="${a.price}"></div>
          </div>
        </div>
        <div class="card-actions">
          <button class="icon-btn save-btn">Save</button>
          <button class="icon-btn danger del-btn">Delete</button>
        </div>
      </div>
    </div>`).join('') || '<p class="hint">No add-ons yet.</p>';

  list.querySelectorAll('.card').forEach(card => {
    const id = card.dataset.id;
    card.querySelector('.save-btn').addEventListener('click', async () => {
      const payload = {};
      card.querySelectorAll('[data-f]').forEach(el => payload[el.dataset.f] = el.dataset.num ? Number(el.value) : el.value);
      const { error } = await sb.from('addons').update(payload).eq('id', id);
      if (error) toast('Save failed: ' + error.message, true); else toast('Add-on saved.');
    });
    card.querySelector('.del-btn').addEventListener('click', () => deleteRow('addons', id, loadAddons));
  });
}
document.getElementById('addon-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = fd(e.target);
  payload.price = Number(payload.price);
  const { error } = await sb.from('addons').insert(payload);
  if (error) toast('Add failed: ' + error.message, true);
  else { toast('Add-on added.'); e.target.reset(); loadAddons(); }
});

checkSession();

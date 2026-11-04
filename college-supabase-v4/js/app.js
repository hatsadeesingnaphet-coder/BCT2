import { sb, currentUser } from './supabase.js';
import { renderNav } from './nav.js';
import { SUPABASE_URL } from './config.js';
import * as home from './pages/home.js';
import * as students from './pages/students.js';
import * as form from './pages/student-form.js';
import * as reports from './pages/reports.js';
import * as years from './pages/years.js';
import * as menus from './pages/menus.js';
import * as login from './pages/login.js';

// auth: true = ຕ້ອງ login ກ່ອນ (ຖ້າຍັງ → ໄປໜ້າ login ແລ້ວກັບມາອັດຕະໂນມັດ)
// ເພີ່ມໜ້າໃໝ່: ສ້າງ js/pages/xxx.js ແລ້ວເພີ່ມແຖວບ່ອນນີ້ → ແລ້ວໄປເພີ່ມເມນູ (#/menus)
const routes = [
  { re: /^#\/login/,                  page: login.render },
  { re: /^#\/account/,                page: login.account, auth: true },
  { re: /^#\/students\/new$/,         page: form.render },              // ທຸກຄົນເພີ່ມໄດ້
  { re: /^#\/students\/(\d+)\/edit$/, page: form.render, auth: true }, // ແກ້ໄຂ: admin
  { re: /^#\/students\/(\d+)$/,       page: students.detail },
  { re: /^#\/students/,               page: students.list },
  { re: /^#\/reports/,                page: reports.render },
  { re: /^#\/years/,                  page: years.render, auth: true },
  { re: /^#\/menus/,                  page: menus.render, auth: true },
  { re: /^#\/?$/,                     page: home.render },
];

async function render() {
  const main = document.getElementById('main');
  if (SUPABASE_URL.includes('YOUR-PROJECT')) {
    main.innerHTML = `<div class="card card-body">⚠️ ຍັງບໍ່ໄດ້ຕັ້ງຄ່າ Supabase – ແກ້ <code>js/config.js</code> ໃສ່ <b>SUPABASE_URL</b> ແລະ <b>SUPABASE_ANON_KEY</b> (Dashboard → Project Settings → API)</div>`;
    return;
  }
  const hash = location.hash || '#/';
  const path = hash.split('?')[0];
  const route = routes.find((r) => r.re.test(path));
  if (!route) { location.hash = '#/'; return; }
  const user = await currentUser();
  if (route.auth && !user) { location.hash = `#/login?next=${encodeURIComponent(hash)}`; return; }

  main.innerHTML = '<div class="empty">ກຳລັງໂຫລດ...</div>';
  try {
    await Promise.all([renderNav(user), route.page({ main, user, params: path.match(route.re).slice(1) })]);
  } catch (e) {
    console.error(e);
    main.innerHTML = `<div class="card card-body" style="border-color:var(--danger);color:var(--danger)">ເກີດຂໍ້ຜິດພາດ: ${e.message}</div>`;
  }
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);
sb.auth.onAuthStateChange((event) => { if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') render(); });
render();

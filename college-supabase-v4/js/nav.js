import { sb } from './supabase.js';
import { esc, toast } from './utils.js';
import { APP_NAME } from './config.js';

export async function renderNav(user) {
  document.querySelectorAll('[data-app-name]').forEach((e) => (e.textContent = APP_NAME));
  document.title = APP_NAME;
  const [{ data: menus }, { data: year }] = await Promise.all([
    sb.from('menus').select('*').eq('is_active', true).order('sort_order'),
    sb.from('academic_years').select('name').eq('is_current', true).maybeSingle(),
  ]);
  document.getElementById('currentYear').textContent = year ? `ສົກຮຽນ ${year.name}` : 'ຍັງບໍ່ຕັ້ງສົກຮຽນ';

  const current = (location.hash.split('?')[0] || '#/');
  const isActive = (url) => url && (url === '#/' ? current === '#/' || current === '' : current.startsWith(url));
  const visible = (menus ?? []).filter((m) => !m.is_admin_only || user);
  const roots = visible.filter((m) => !m.parent_id);
  const kids = (id) => visible.filter((m) => m.parent_id === id);
  const link = (m, cls = '') => `<a href="${esc(m.url || '#')}" class="${cls} ${isActive(m.url) ? 'active' : ''}"><span class="ico">${esc(m.icon ?? '•')}</span>${esc(m.title)}</a>`;

  document.getElementById('nav').innerHTML = `<div class="label">ເມນູ</div>` +
    roots.map((m) => link(m) + kids(m.id).map((c) => link(c, 'child')).join('')).join('');

  // ສ່ວນລຸ່ມ sidebar: ສະຖານະ login
  document.getElementById('authBox').innerHTML = user
    ? `<a href="#/account" class="user ${current === '#/account' ? 'active' : ''}"><span class="ico">👤</span><span class="grow" style="overflow:hidden;text-overflow:ellipsis">${esc(user.email)}</span></a>
       <button id="logoutBtn" class="btn btn-sm" style="width:100%;justify-content:center;margin-top:8px">ອອກຈາກລະບົບ</button>`
    : `<a href="#/login?next=${encodeURIComponent(current)}" class="btn btn-primary btn-sm" style="width:100%;justify-content:center">🔐 ເຂົ້າສູ່ລະບົບຜູ້ບໍລິຫານ</a>
       <div class="small" style="color:#475569;margin-top:8px;text-align:center">ເບິ່ງ + ເພີ່ມນັກສຶກສາ ບໍ່ຕ້ອງ login</div>`;
  document.getElementById('logoutBtn')?.addEventListener('click', async () => { location.hash = '#/'; await sb.auth.signOut(); toast('ອອກຈາກລະບົບແລ້ວ', 'info'); });
}

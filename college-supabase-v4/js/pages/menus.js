import { sb } from '../supabase.js';
import { esc, toast, confirmDlg, setTitle, field, select, hashQuery } from '../utils.js';
import { renderNav } from '../nav.js';

export async function render({ main, user }) {
  setTitle('ຈັດການເມນູ');
  const { data: rows } = await sb.from('menus').select('*').order('sort_order');
  const roots = (rows ?? []).filter((m) => !m.parent_id);
  const ordered = roots.flatMap((r) => [r, ...(rows ?? []).filter((c) => c.parent_id === r.id)]);
  const m = (rows ?? []).find((x) => String(x.id) === hashQuery().edit) ?? { sort_order: (rows?.length ?? 0) + 1, is_active: true };

  main.innerHTML = `
  <div class="page-head"><div><h1>☰ ຈັດການເມນູ</h1><p>ເມນູທີ່ເພີ່ມບ່ອນນີ້ປາກົດຢູ່ແຖບຊ້າຍທັນທີ · ເພີ່ມໜ້າໃໝ່: ສ້າງ <code>js/pages/xxx.js</code> + route ໃນ <code>js/app.js</code> ແລ້ວຊີ້ URL ມາ (ເຊັ່ນ <code>#/majors</code>) ຫຼື ລິ້ງພາຍນອກ https://...</p></div></div>
  <div class="grid" style="grid-template-columns: 1fr 360px; align-items:start">
    <div class="card"><div class="table-wrap"><table><thead><tr><th>ລຳດັບ</th><th>ເມນູ</th><th>URL</th><th>ສິດ</th><th>ສະຖານະ</th><th></th></tr></thead><tbody>
      ${ordered.map((x) => `<tr ${x.id === m.id ? 'style="background:var(--primary-soft)"' : ''}><td class="muted">${x.sort_order}</td>
        <td>${x.parent_id ? '<span class="muted">└</span> ' : ''}${esc(x.icon ?? '')} <b>${esc(x.title)}</b></td><td class="muted small">${esc(x.url)}</td>
        <td>${x.is_admin_only ? '<span class="badge badge-warn">🔐 admin</span>' : '<span class="badge">ທຸກຄົນ</span>'}</td>
        <td>${x.is_active ? '<span class="badge badge-success">ເປີດ</span>' : '<span class="badge">ປິດ</span>'}</td>
        <td class="actions"><a href="#/menus?edit=${x.id}" class="btn btn-sm">✏️</a><button class="btn btn-sm btn-danger" data-del="${x.id}">🗑</button></td></tr>`).join('') || '<tr><td colspan="6" class="empty">ຍັງບໍ່ມີເມນູ</td></tr>'}
    </tbody></table></div></div>
    <form id="menuForm" class="card card-body grid"><h2>${m.id ? '✏️ ແກ້ໄຂເມນູ' : '➕ ເພີ່ມເມນູ'}</h2>
      <div class="grid" style="grid-template-columns: 1fr 80px">${field('ຊື່ເມນູ', 'title', m.title, { required: true })}${field('Icon', 'icon', m.icon, { placeholder: '📚' })}</div>
      ${field('URL', 'url', m.url, { placeholder: '#/reports ຫຼື https://...' })}
      <div class="grid grid-2">${select('ເມນູແມ່', 'parent_id', roots.filter((r) => r.id !== m.id).map((r) => [r.id, r.title]), m.parent_id ?? '', { blank: '— ເມນູຫຼັກ —' })}${field('ລຳດັບ', 'sort_order', m.sort_order ?? 0, { type: 'number' })}</div>
      <label class="check"><input type="checkbox" name="is_admin_only" ${m.is_admin_only ? 'checked' : ''}> 🔐 ສະແດງສະເພາະຫຼັງ login (ຜູ້ບໍລິຫານ)</label>
      <label class="check"><input type="checkbox" name="is_active" ${m.is_active ? 'checked' : ''}> ເປີດໃຊ້ງານ</label>
      <div class="flex"><button class="btn btn-primary grow" style="justify-content:center">💾 ບັນທຶກ</button>${m.id ? '<a href="#/menus" class="btn">ຍົກເລີກ</a>' : ''}</div></form>
  </div>`;

  const refresh = async () => { await renderNav(user); if (location.hash !== '#/menus') location.hash = '#/menus'; else render({ main, user }); };
  main.querySelector('#menuForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const fd = new FormData(e.target);
    const rec = { title: fd.get('title').trim(), icon: fd.get('icon').trim() || null, url: fd.get('url').trim() || null,
      parent_id: fd.get('parent_id') ? Number(fd.get('parent_id')) : null, sort_order: Number(fd.get('sort_order') || 0), is_admin_only: fd.get('is_admin_only') === 'on', is_active: fd.get('is_active') === 'on' };
    const { error } = m.id ? await sb.from('menus').update(rec).eq('id', m.id) : await sb.from('menus').insert(rec);
    if (error) return toast(error.message, 'error'); toast('ບັນທຶກເມນູແລ້ວ'); refresh();
  });
  main.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (!(await confirmDlg('ລົບເມນູ', 'ຢືນຢັນລົບເມນູນີ້?'))) return;
    const { error } = await sb.from('menus').delete().eq('id', b.dataset.del);
    if (error) return toast(error.message, 'error'); toast('ລົບແລ້ວ'); refresh();
  }));
}

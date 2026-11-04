import { sb } from '../supabase.js';
import { esc, toast, confirmDlg, setTitle, field } from '../utils.js';
import { renderNav } from '../nav.js';

export async function render({ main, user }) {
  setTitle('ສົກຮຽນ');
  const { data: rows } = await sb.from('academic_years').select('*, students(count)').order('name', { ascending: false });
  main.innerHTML = `
  <div class="page-head"><div><h1>📅 ສົກຮຽນ</h1><p>ສົກຮຽນ "ປັດຈຸບັນ" ຈະຖືກເລືອກອັດຕະໂນມັດເມື່ອເພີ່ມນັກສຶກສາ</p></div></div>
  <div class="grid" style="grid-template-columns: 1fr 340px; align-items:start">
    <div class="card"><div class="table-wrap"><table><thead><tr><th>ລ/ດ</th><th>ສົກຮຽນ</th><th class="right">ນັກສຶກສາ</th><th>ສະຖານະ</th><th></th></tr></thead><tbody>
      ${(rows ?? []).map((y, i) => `<tr><td class="muted">${i + 1}</td><td><b>${esc(y.name)}</b></td><td class="right">${y.students?.[0]?.count ?? 0}</td>
        <td>${y.is_current ? '<span class="badge badge-success">✓ ປັດຈຸບັນ</span>' : `<button class="link-btn small" data-cur="${y.id}">ຕັ້ງເປັນປັດຈຸບັນ</button>`}</td>
        <td class="actions"><button class="btn btn-sm" data-edit="${y.id}" data-name="${esc(y.name)}">✏️</button><button class="btn btn-sm btn-danger" data-del="${y.id}" data-name="${esc(y.name)}">🗑</button></td></tr>`).join('')
        || '<tr><td colspan="5" class="empty">ຍັງບໍ່ມີສົກຮຽນ</td></tr>'}</tbody></table></div></div>
    <form id="yearForm" class="card card-body grid"><h2>➕ ເພີ່ມສົກຮຽນ</h2>
      ${field('ສົກຮຽນ', 'name', '', { required: true, placeholder: '2027-2028' })}
      <div class="small muted">ຮູບແບບ ປີເລີ່ມ-ປີຈົບ ເຊັ່ນ 2026-2027</div>
      <label class="check"><input type="checkbox" name="is_current"> ຕັ້ງເປັນສົກຮຽນປັດຈຸບັນ</label>
      <button class="btn btn-primary">💾 ບັນທຶກ</button></form>
  </div>`;

  const refresh = async () => { await renderNav(user); render({ main, user }); };
  main.querySelector('#yearForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const fd = new FormData(e.target); const name = fd.get('name').trim();
    if (!/^\d{4}-\d{4}$/.test(name)) return toast('ຮູບແບບຕ້ອງເປັນ ປີ-ປີ ເຊັ່ນ 2026-2027', 'error');
    const { error } = await sb.from('academic_years').insert({ name, is_current: fd.get('is_current') === 'on' });
    if (error) return toast(error.message.includes('unique') || error.code === '23505' ? 'ສົກຮຽນນີ້ມີແລ້ວ' : error.message, 'error');
    toast('ເພີ່ມສົກຮຽນສຳເລັດ'); refresh();
  });
  main.querySelectorAll('[data-cur]').forEach((b) => b.addEventListener('click', async () => {
    await sb.from('academic_years').update({ is_current: true }).eq('id', b.dataset.cur);
    await sb.from('academic_years').update({ is_current: false }).neq('id', b.dataset.cur);
    toast('ຕັ້ງສົກຮຽນປັດຈຸບັນແລ້ວ'); refresh();
  }));
  main.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', async () => {
    const name = prompt('ແກ້ໄຂຊື່ສົກຮຽນ', b.dataset.name)?.trim(); if (!name || name === b.dataset.name) return;
    if (!/^\d{4}-\d{4}$/.test(name)) return toast('ຮູບແບບຕ້ອງເປັນ ປີ-ປີ', 'error');
    const { error } = await sb.from('academic_years').update({ name }).eq('id', b.dataset.edit);
    if (error) return toast(error.message, 'error'); toast('ແກ້ໄຂແລ້ວ'); refresh();
  }));
  main.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (!(await confirmDlg('ລົບສົກຮຽນ', `ຢືນຢັນລົບສົກຮຽນ <b>${b.dataset.name}</b>?`))) return;
    const { error } = await sb.from('academic_years').delete().eq('id', b.dataset.del);
    if (error) return toast('ລົບບໍ່ໄດ້: ສົກຮຽນນີ້ມີນັກສຶກສາຢູ່ – ຍ້າຍ/ລົບນັກສຶກສາກ່ອນ', 'error');
    toast('ລົບແລ້ວ'); refresh();
  }));
}

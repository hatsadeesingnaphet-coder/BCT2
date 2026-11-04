import { sb, photoUrl, loadYears } from '../supabase.js';
import { esc, fullLo, fullEn, genderBadge, laoDate, setTitle } from '../utils.js';

export async function render({ main, user }) {
  setTitle('ພາບລວມ');
  const years = await loadYears();
  const cur = years.find((y) => y.is_current);
  const inYear = (q) => (cur ? q.eq('academic_year_id', cur.id) : q);

  const [{ count: total }, { count: inCur }, { count: male }, { count: female }, { data: recent }, { data: byYear }] = await Promise.all([
    sb.from('students').select('id', { count: 'exact', head: true }),
    inYear(sb.from('students').select('id', { count: 'exact', head: true })),
    inYear(sb.from('students').select('id', { count: 'exact', head: true }).eq('gender', 'M')),
    inYear(sb.from('students').select('id', { count: 'exact', head: true }).eq('gender', 'F')),
    sb.from('students').select('*, academic_years(name)').order('created_at', { ascending: false }).limit(6),
    sb.from('v_report_by_year').select('*'),
  ]);
  const max = Math.max(1, ...(byYear ?? []).map((r) => Number(r.total)));
  const stat = (ico, n, l, bg = '') => `<div class="card stat"><div class="ico" style="${bg}">${ico}</div><div><div class="n">${n ?? 0}</div><div class="l">${l}</div></div></div>`;

  main.innerHTML = `
  <div class="page-head"><div><h1>ສະບາຍດີ 👋</h1><p>ສະຫຼຸບຂໍ້ມູນນັກສຶກສາ ${cur ? 'ສົກຮຽນ ' + esc(cur.name) : ''}</p></div>
    <div class="flex no-print"><a href="#/reports" class="btn">📊 ລາຍງານ</a><a href="#/students/new" class="btn btn-primary">＋ ເພີ່ມນັກສຶກສາ</a></div></div>

  <div class="grid grid-4 mb-4">
    ${stat('🎓', inCur, cur ? `ນັກສຶກສາ ${esc(cur.name)}` : 'ນັກສຶກສາ')}
    ${stat('👨', male, 'ຊາຍ', 'background:#dbeafe')}
    ${stat('👩', female, 'ຍິງ', 'background:var(--pink-soft)')}
    ${stat('🗂️', total, 'ທັງໝົດທຸກສົກຮຽນ', 'background:var(--warn-soft)')}
  </div>

  <div class="grid" style="grid-template-columns: 1.4fr 1fr">
    <div class="card">
      <div class="card-head"><h2>ເພີ່ມຫຼ້າສຸດ</h2><a href="#/students" class="small">ເບິ່ງທັງໝົດ →</a></div>
      <div class="table-wrap"><table><thead><tr><th>ນັກສຶກສາ</th><th>ເພດ</th><th>ວັນເກີດ</th><th>ສົກຮຽນ</th></tr></thead><tbody>
        ${(recent ?? []).map((s) => `<tr>
          <td><a href="#/students/${s.id}" class="person" style="color:inherit"><img class="avatar" src="${photoUrl(s.photo_path, fullEn(s))}" alt=""><div><b>${esc(fullLo(s))}</b><span>${esc(fullEn(s))}</span></div></a></td>
          <td>${genderBadge(s.gender)}</td><td>${laoDate(s.dob)}</td><td><span class="badge">${esc(s.academic_years?.name)}</span></td></tr>`).join('')
          || `<tr><td colspan="4" class="empty"><div class="big">🎓</div>ຍັງບໍ່ມີນັກສຶກສາ – <a href="#/students/new">ເພີ່ມຄົນທຳອິດ</a></td></tr>`}
      </tbody></table></div>
    </div>
    <div class="card">
      <div class="card-head"><h2>ຈຳນວນຕາມສົກຮຽນ</h2>${user ? '<a href="#/years" class="small">ຈັດການສົກຮຽນ →</a>' : ''}</div>
      <div class="card-body" style="display:grid;gap:14px">
        ${(byYear ?? []).map((r) => `<div><div class="flex between small"><b>${esc(r.name)}</b><span class="muted">ຊາຍ ${r.male} · ຍິງ ${r.female} · <b style="color:var(--text)">${r.total}</b></span></div>
          <div class="bar mt-1"><i style="width:${(r.total / max) * 100}%"></i></div></div>`).join('') || '<div class="empty">ຍັງບໍ່ມີສົກຮຽນ</div>'}
      </div>
    </div>
  </div>`;
}

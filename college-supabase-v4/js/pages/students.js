import { sb, photoUrl, loadYears, isAuthError } from '../supabase.js';
import { esc, laoDate, enDate, age, genderBadge, fullLo, fullEn, hashQuery, setHash, setTitle, toast, confirmDlg, debounce } from '../utils.js';
import { PAGE_SIZE } from '../config.js';
import { exportExcel } from './reports.js';

/** query ໃຊ້ຮ່ວມກັນ (ລາຍຊື່ / export) */
export function studentQuery(f, select = '*, academic_years(name)') {
  let q = sb.from('students').select(select, { count: 'exact' });
  if (f.year) q = q.eq('academic_year_id', f.year);
  if (f.gender) q = q.eq('gender', f.gender);
  if (f.province) q = q.eq('birth_province', f.province);
  if (f.q) { const s = `%${f.q}%`; q = q.or(`first_name_lo.ilike.${s},last_name_lo.ilike.${s},first_name_en.ilike.${s},last_name_en.ilike.${s},student_code.ilike.${s},phone.ilike.${s}`); }
  return q;
}

export async function deleteStudent(s) {
  if (!(await confirmDlg('ລົບນັກສຶກສາ', `ຢືນຢັນລົບ <b>${esc(fullLo(s))}</b>? ຂໍ້ມູນຈະຖືກລົບຖາວອນ.`))) return false;
  const { error } = await sb.from('students').delete().eq('id', s.id);
  if (error) { toast(isAuthError(error) ? 'ກະລຸນາເຂົ້າສູ່ລະບົບກ່ອນ' : 'ລົບບໍ່ສຳເລັດ: ' + error.message, 'error'); return false; }
  if (s.photo_path) sb.storage.from('student-photos').remove([s.photo_path]);
  toast(`ລົບ ${fullLo(s)} ແລ້ວ`); return true;
}

export async function list({ main, user }) {
  setTitle('ນັກສຶກສາ');
  const f = hashQuery();
  const years = await loadYears();
  if (!('year' in f)) f.year = years.find((y) => y.is_current)?.id ?? '';
  const page = Math.max(1, Number(f.page) || 1);
  const sort = f.sort || 'id.desc';
  const [col, dir] = sort.split('.');

  const [{ data, count, error }, { data: provRows }] = await Promise.all([
    studentQuery(f).order(col, { ascending: dir === 'asc' }).range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1),
    sb.from('students').select('birth_province').not('birth_province', 'is', null),
  ]);
  if (error) throw error;
  const provinces = [...new Set((provRows ?? []).map((r) => r.birth_province))].sort();
  const pages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const th = (c, label) => `<th><a href="#/students?${new URLSearchParams({ ...f, page: 1, sort: `${c}.${col === c && dir === 'asc' ? 'desc' : 'asc'}` })}" style="color:inherit">${label} ${col === c ? (dir === 'asc' ? '↑' : '↓') : ''}</a></th>`;

  main.innerHTML = `
  <div class="page-head"><div><h1>🎓 ນັກສຶກສາ</h1><p>${count ?? 0} ຄົນ ${f.year ? '· ສົກຮຽນ ' + esc(years.find((y) => String(y.id) === String(f.year))?.name ?? '') : '· ທຸກສົກຮຽນ'}</p></div>
    <div class="flex no-print"><button id="exportBtn" class="btn btn-success">⬇ ສົ່ງອອກ Excel</button><a href="#/students/new" class="btn btn-primary">＋ ເພີ່ມນັກສຶກສາ</a></div></div>

  <form id="filterForm" class="card card-body toolbar mb-2 no-print">
    <div class="search"><input class="input" type="search" name="q" value="${esc(f.q ?? '')}" placeholder="ຄົ້ນຫາ ຊື່ / ລະຫັດ / ເບີໂທ..."></div>
    <select name="year"><option value="">— ທຸກສົກຮຽນ —</option>${years.map((y) => `<option value="${y.id}" ${String(f.year) === String(y.id) ? 'selected' : ''}>${esc(y.name)}</option>`).join('')}</select>
    <select name="gender"><option value="">— ທຸກເພດ —</option><option value="M" ${f.gender === 'M' ? 'selected' : ''}>ຊາຍ</option><option value="F" ${f.gender === 'F' ? 'selected' : ''}>ຍິງ</option></select>
    <select name="province"><option value="">— ທຸກແຂວງ —</option>${provinces.map((p) => `<option value="${esc(p)}" ${f.province === p ? 'selected' : ''}>${esc(p)}</option>`).join('')}</select>
    <a href="#/students?year=" class="btn btn-ghost">ລ້າງ</a>
  </form>

  <div class="card">
    <div class="table-wrap"><table>
      <thead><tr><th>#</th>${th('first_name_lo', 'ນັກສຶກສາ')}<th>ເພດ</th>${th('dob', 'ວັນເດືອນປີເກີດ')}<th>ອາຍຸ</th><th>ແຂວງ</th><th>ສົກຮຽນ</th><th>ເບີໂທ</th><th></th></tr></thead>
      <tbody>${(data ?? []).map((s, i) => `<tr>
        <td class="muted">${(page - 1) * PAGE_SIZE + i + 1}</td>
        <td><a href="#/students/${s.id}" class="person" style="color:inherit"><img class="avatar" src="${photoUrl(s.photo_path, fullEn(s))}" alt=""><div><b>${esc(fullLo(s))}</b><span>${esc(fullEn(s))}${s.student_code ? ' · ' + esc(s.student_code) : ''}</span></div></a></td>
        <td>${genderBadge(s.gender)}</td><td>${laoDate(s.dob)}</td><td>${age(s.dob)}</td><td>${esc(s.birth_province)}</td>
        <td><span class="badge">${esc(s.academic_years?.name)}</span></td><td>${esc(s.phone)}</td>
        <td class="actions no-print"><a href="#/students/${s.id}" class="btn btn-sm btn-ghost">ເບິ່ງ</a>${user ? `<a href="#/students/${s.id}/edit" class="btn btn-sm">✏️</a><button data-del="${s.id}" class="btn btn-sm btn-danger">🗑</button>` : ''}</td></tr>`).join('')
        || `<tr><td colspan="9" class="empty"><div class="big">🔍</div>ບໍ່ພົບຂໍ້ມູນນັກສຶກສາ</td></tr>`}
      </tbody></table></div>
    ${pages > 1 ? `<div class="pager"><span>ໜ້າ ${page} / ${pages}</span><div class="flex">
      <a class="btn btn-sm ${page <= 1 ? 'hidden' : ''}" href="#/students?${new URLSearchParams({ ...f, page: page - 1 })}">← ກ່ອນ</a>
      <a class="btn btn-sm ${page >= pages ? 'hidden' : ''}" href="#/students?${new URLSearchParams({ ...f, page: page + 1 })}">ຕໍ່ໄປ →</a></div></div>` : ''}
  </div>`;

  const form = main.querySelector('#filterForm');
  const apply = () => setHash('#/students', { ...Object.fromEntries(new FormData(form)), sort });
  form.addEventListener('submit', (e) => { e.preventDefault(); apply(); });
  form.querySelectorAll('select').forEach((s) => s.addEventListener('change', apply));
  form.q.addEventListener('input', debounce(apply, 400));          // ຄົ້ນຫາສົດ
  main.querySelector('#exportBtn').addEventListener('click', () => exportExcel(f));
  main.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
    if (await deleteStudent(data.find((x) => String(x.id) === b.dataset.del))) list({ main, user });
  }));
}

export async function detail({ main, user, params }) {
  const { data: s, error } = await sb.from('students').select('*, academic_years(name)').eq('id', params[0]).single();
  if (error || !s) { main.innerHTML = '<div class="card empty">ບໍ່ພົບຂໍ້ມູນ</div>'; return; }
  setTitle(fullLo(s));
  const place = [s.birth_village && 'ບ. ' + s.birth_village, s.birth_district && 'ມ. ' + s.birth_district, s.birth_province && 'ຂ. ' + s.birth_province].filter(Boolean).join(', ');
  const tel = (n) => (n ? `<a href="tel:${esc(n)}">${esc(n)}</a>` : '—');
  const rows = [
    ['ລະຫັດນັກສຶກສາ', esc(s.student_code) || '—'], ['ສົກຮຽນ', esc(s.academic_years?.name)],
    ['ເພດ', genderBadge(s.gender)], ['ອາຍຸ', `${age(s.dob)} ປີ`],
    ['ວັນເດືອນປີເກີດ (ລາວ)', laoDate(s.dob)], ['Date of Birth (English)', enDate(s.dob)],
    ['ທີ່ເກີດ', esc(place) || '—'], ['ຮຽນຈົບ ມ.7 ຈາກ', esc(s.high_school) || '—'],
    ['ເບີໂທ', tel(s.phone)], ['ເບີໂທສຸກເສີນ', tel(s.emergency_phone)],
    ['ເບີໂທພໍ່', tel(s.father_phone)], ['ເບີໂທແມ່', tel(s.mother_phone)],
  ];
  main.innerHTML = `
  <div class="flex between mb-2 no-print"><a href="#/students" class="btn btn-ghost">← ກັບຄືນ</a>
    <div class="flex"><button class="btn" onclick="print()">🖨 ພິມ</button>${user ? `<a href="#/students/${s.id}/edit" class="btn btn-primary">✏️ ແກ້ໄຂ</a><button id="delBtn" class="btn btn-danger">🗑 ລົບ</button>` : `<a href="#/login?next=${encodeURIComponent('#/students/' + s.id + '/edit')}" class="btn btn-ghost small">🔐 ເຂົ້າສູ່ລະບົບເພື່ອແກ້ໄຂ</a>`}</div></div>
  <div class="card">
    <div class="profile-hero"><img src="${photoUrl(s.photo_path, fullEn(s))}" alt="">
      <div><h1>${esc(fullLo(s))}</h1><div class="en">${esc(fullEn(s))}</div>
        <div class="meta"><span class="badge">ສົກຮຽນ ${esc(s.academic_years?.name)}</span>${s.student_code ? `<span class="badge">${esc(s.student_code)}</span>` : ''}<span class="badge">${genderLo(s.gender)} · ${age(s.dob)} ປີ</span></div></div></div>
    <dl class="kv" style="margin:0">${rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl>
  </div>`;
  main.querySelector('#delBtn')?.addEventListener('click', async () => { if (await deleteStudent(s)) location.hash = '#/students'; });
}
function genderLo(g) { return g === 'M' ? 'ຊາຍ' : 'ຍິງ'; }

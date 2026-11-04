import { sb, loadYears } from '../supabase.js';
import { esc, hashQuery, setHash, toast, setTitle } from '../utils.js';

/** ສົ່ງອອກ Excel ຈາກ view v_students_report */
export async function exportExcel(f = {}) {
  toast('ກຳລັງສ້າງໄຟລ໌ Excel...', 'info');
  let q = sb.from('v_students_report').select('*');
  if (f.year) q = q.eq('academic_year_id', f.year);
  if (f.gender) q = q.eq('gender', f.gender);
  if (f.province) q = q.eq('province_key', f.province);
  let { data, error } = await q.limit(10000);
  if (error) return toast('ສົ່ງອອກບໍ່ສຳເລັດ: ' + error.message, 'error');
  if (f.q) { const k = f.q.toLowerCase(); data = data.filter((r) => ['ຊື່ ແລະ ນາມສະກຸນ (ລາວ)', 'Name (English)', 'ລະຫັດ', 'ເບີໂທ'].some((c) => String(r[c] ?? '').toLowerCase().includes(k))); }
  if (!data?.length) return toast('ບໍ່ມີຂໍ້ມູນໃຫ້ສົ່ງອອກ', 'error');

  const XLSX = await import('https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs');
  const rows = data.map(({ id, academic_year_id, gender, province_key, ...rest }, i) => ({ 'ລ/ດ': i + 1, ...rest }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = Object.keys(rows[0]).map((k) => ({ wch: Math.min(40, Math.max(10, k.length + 2, ...rows.slice(0, 200).map((r) => String(r[k] ?? '').length + 2))) }));
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, 'ນັກສຶກສາ');
  XLSX.writeFile(wb, `students-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export async function render({ main }) {
  setTitle('ລາຍງານ');
  const f = hashQuery();
  const years = await loadYears();
  const Y = (q) => (f.year ? q.eq('academic_year_id', f.year) : q);
  const G = (q) => (f.gender ? q.eq('gender', f.gender) : q);

  const [{ count: total }, { count: male }, { count: female }, { data: byYear }, { data: byProv }, { data: bySchool }] = await Promise.all([
    G(Y(sb.from('students').select('id', { count: 'exact', head: true }))),
    Y(sb.from('students').select('id', { count: 'exact', head: true }).eq('gender', 'M')),
    Y(sb.from('students').select('id', { count: 'exact', head: true }).eq('gender', 'F')),
    Y(sb.from('v_report_by_year').select('*')),
    Y(sb.from('v_report_by_province').select('*')),
    Y(sb.from('v_report_by_school').select('*')),
  ]);
  const sum = (rows, key) => Object.entries((rows ?? []).reduce((a, r) => ((a[r[key]] = (a[r[key]] ?? 0) + Number(r.total)), a), {})).sort((a, b) => b[1] - a[1]);
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);
  const stat = (ico, n, l, bg = '') => `<div class="card stat"><div class="ico" style="${bg}">${ico}</div><div><div class="n">${n}</div><div class="l">${l}</div></div></div>`;
  const barList = (title, rows, max) => `<div class="card"><div class="card-head"><h2>${title}</h2><span class="badge">${rows.length}</span></div>
    <div class="card-body" style="display:grid;gap:12px">${rows.map(([k, n]) => `<div><div class="flex between small"><span>${esc(k)}</span><b>${n}</b></div><div class="bar mt-1"><i style="width:${(n / max) * 100}%"></i></div></div>`).join('') || '<div class="empty">ບໍ່ມີຂໍ້ມູນ</div>'}</div></div>`;
  const provs = sum(byProv, 'province'), schools = sum(bySchool, 'high_school').slice(0, 15);

  main.innerHTML = `
  <div class="page-head"><div><h1>📊 ລາຍງານຂໍ້ມູນນັກສຶກສາ</h1><p>ສະຫຼຸບຈາກຕາຕະລາງປະຫວັດນັກສຶກສາ</p></div>
    <div class="flex no-print"><button class="btn" onclick="print()">🖨 ພິມ</button><button id="exportBtn" class="btn btn-success">⬇ ສົ່ງອອກ Excel</button></div></div>
  <form id="filterForm" class="card card-body flex wrap mb-2 no-print">
    <select name="year" style="width:auto"><option value="">— ທຸກສົກຮຽນ —</option>${years.map((y) => `<option value="${y.id}" ${String(f.year) === String(y.id) ? 'selected' : ''}>${esc(y.name)}</option>`).join('')}</select>
    <select name="gender" style="width:auto"><option value="">— ທຸກເພດ —</option><option value="M" ${f.gender === 'M' ? 'selected' : ''}>ຊາຍ</option><option value="F" ${f.gender === 'F' ? 'selected' : ''}>ຍິງ</option></select>
    <a href="#/reports" class="btn btn-ghost">ລ້າງ</a></form>
  <div class="grid grid-3 mb-4">${stat('🎓', total ?? 0, 'ນັກສຶກສາທັງໝົດ')}${stat('👨', `${male ?? 0} <span class="small muted">(${pct(male)}%)</span>`, 'ຊາຍ', 'background:#dbeafe')}${stat('👩', `${female ?? 0} <span class="small muted">(${pct(female)}%)</span>`, 'ຍິງ', 'background:var(--pink-soft)')}</div>
  <div class="grid grid-3">
    <div class="card"><div class="card-head"><h2>ຕາມສົກຮຽນ</h2></div><div class="table-wrap"><table><thead><tr><th>ສົກຮຽນ</th><th class="right">ຊາຍ</th><th class="right">ຍິງ</th><th class="right">ລວມ</th></tr></thead>
      <tbody>${(byYear ?? []).map((r) => `<tr><td>${esc(r.name)}</td><td class="right">${r.male}</td><td class="right">${r.female}</td><td class="right"><b>${r.total}</b></td></tr>`).join('') || '<tr><td colspan="4" class="empty">ບໍ່ມີຂໍ້ມູນ</td></tr>'}</tbody></table></div></div>
    ${barList('ຕາມແຂວງທີ່ເກີດ', provs, provs[0]?.[1] ?? 1)}
    ${barList('ຕາມໂຮງຮຽນ ມ.ສ (15 ອັນດັບ)', schools, schools[0]?.[1] ?? 1)}
  </div>`;
  const form = main.querySelector('#filterForm');
  form.querySelectorAll('select').forEach((s) => s.addEventListener('change', () => setHash('#/reports', Object.fromEntries(new FormData(form)))));
  main.querySelector('#exportBtn').addEventListener('click', () => exportExcel(f));
}

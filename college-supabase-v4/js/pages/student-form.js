import { sb, photoUrl, loadYears, isAuthError } from '../supabase.js';
import { esc, laoDate, enDate, fullEn, field, select, toast, setTitle } from '../utils.js';

const FIELDS = ['academic_year_id','student_code','first_name_lo','last_name_lo','first_name_en','last_name_en','gender','dob','birth_village','birth_district','birth_province','high_school','phone','father_phone','mother_phone','emergency_phone'];

export async function render({ main, user, params }) {
  const id = params[0];
  const isNew = !id;
  const years = await loadYears();
  if (!years.length) { main.innerHTML = '<div class="card empty">ກະລຸນາ <a href="#/years">ເພີ່ມສົກຮຽນ</a> ກ່ອນ ຈຶ່ງເພີ່ມນັກສຶກສາໄດ້</div>'; return; }
  let s = { academic_year_id: years.find((y) => y.is_current)?.id ?? years[0].id, gender: 'M' };
  if (!isNew) { const { data, error } = await sb.from('students').select('*').eq('id', id).single(); if (error) throw error; s = data; }
  setTitle(isNew ? 'ເພີ່ມນັກສຶກສາ' : 'ແກ້ໄຂນັກສຶກສາ');

  // datalist ແຂວງ/ໂຮງຮຽນ ທີ່ເຄີຍພິມ (ຊ່ວຍພິມໃຫ້ສະກົດຄືກັນ)
  const { data: hints } = await sb.from('students').select('birth_province, birth_district, high_school').limit(1000);
  const uniq = (k) => [...new Set((hints ?? []).map((r) => r[k]).filter(Boolean))].sort();
  const dl = (id, arr) => `<datalist id="${id}">${arr.map((v) => `<option value="${esc(v)}">`).join('')}</datalist>`;

  main.innerHTML = `
  <div class="flex between mb-2"><a href="${isNew ? '#/students' : '#/students/' + id}" class="btn btn-ghost">← ກັບຄືນ</a></div>
  <div class="page-head"><div><h1>${isNew ? '➕ ເພີ່ມນັກສຶກສາໃໝ່' : '✏️ ແກ້ໄຂຂໍ້ມູນນັກສຶກສາ'}</h1><p>ຊ່ອງທີ່ມີ <i class="req">*</i> ຈຳເປັນຕ້ອງໃສ່${isNew && !user ? ' · ຫຼັງບັນທຶກແລ້ວ ການແກ້ໄຂ/ລົບ ຕ້ອງໃຫ້ຜູ້ບໍລິຫານເຮັດ' : ''}</p></div></div>
  <form id="f" class="grid" style="grid-template-columns: 1fr 300px; align-items:start">
    <div class="grid">
      <div class="card card-body grid grid-2">
        ${select('ສົກຮຽນ', 'academic_year_id', years.map((y) => [y.id, y.name]), s.academic_year_id, { required: true })}
        ${field('ລະຫັດນັກສຶກສາ', 'student_code', s.student_code, { placeholder: 'ST-2026-001' })}
        ${field('ຊື່ (ພາສາລາວ)', 'first_name_lo', s.first_name_lo, { required: true })}
        ${field('ນາມສະກຸນ (ພາສາລາວ)', 'last_name_lo', s.last_name_lo, { required: true })}
        ${field('First name (English)', 'first_name_en', s.first_name_en, { required: true })}
        ${field('Last name (English)', 'last_name_en', s.last_name_en, { required: true })}
        <label class="f"><span>ເພດ <i class="req">*</i></span><div class="radio-group">
          <label><input type="radio" name="gender" value="M" ${s.gender === 'M' ? 'checked' : ''}><span>👨 ຊາຍ</span></label>
          <label><input type="radio" name="gender" value="F" ${s.gender === 'F' ? 'checked' : ''}><span>👩 ຍິງ</span></label></div></label>
        <div>${field('ວັນເດືອນປີເກີດ', 'dob', s.dob, { type: 'date', required: true })}<div id="dobPreview" class="small muted mt-1"></div></div>
      </div>
      <fieldset class="card"><legend>ທີ່ເກີດ ແລະ ການສຶກສາ</legend><div class="grid grid-2">
        ${field('ບ້ານ', 'birth_village', s.birth_village)}
        ${field('ເມືອງ', 'birth_district', s.birth_district).replace('<input', '<input list="dlDistrict"')}
        ${field('ແຂວງ', 'birth_province', s.birth_province).replace('<input', '<input list="dlProvince"')}
        ${field('ຮຽນຈົບ ມ.7 ຈາກ ມ.ສ', 'high_school', s.high_school).replace('<input', '<input list="dlSchool"')}
      </div></fieldset>
      <fieldset class="card"><legend>ຂໍ້ມູນຕິດຕໍ່</legend><div class="grid grid-2">
        ${field('ເບີໂທ', 'phone', s.phone, { type: 'tel', placeholder: '020 xxxx xxxx' })}${field('ເບີໂທສຸກເສີນ', 'emergency_phone', s.emergency_phone, { type: 'tel' })}
        ${field('ເບີໂທພໍ່', 'father_phone', s.father_phone, { type: 'tel' })}${field('ເບີໂທແມ່', 'mother_phone', s.mother_phone, { type: 'tel' })}
      </div></fieldset>
    </div>
    <div class="grid">
      <div class="card card-body"><h3 class="mb-2">ຮູບພາບ</h3>
        <div class="photo-box"><img id="photoPreview" src="${photoUrl(s.photo_path, fullEn(s))}" alt=""><input type="file" name="photo" accept="image/jpeg,image/png,image/webp"><div class="small muted mt-1">JPG / PNG / WEBP · ≤ 2 MB</div></div></div>
      <div class="card card-body grid"><button id="saveBtn" class="btn btn-primary" style="justify-content:center">💾 ບັນທຶກ</button><a href="${isNew ? '#/students' : '#/students/' + id}" class="btn" style="justify-content:center">ຍົກເລີກ</a></div>
    </div>
  </form>
  ${dl('dlProvince', uniq('birth_province'))}${dl('dlDistrict', uniq('birth_district'))}${dl('dlSchool', uniq('high_school'))}`;

  const form = main.querySelector('#f'), prev = main.querySelector('#dobPreview');
  const showDob = () => (prev.textContent = form.dob.value ? `ລາວ: ${laoDate(form.dob.value)}  ·  EN: ${enDate(form.dob.value)}` : '');
  form.dob.addEventListener('input', showDob); showDob();
  form.photo.addEventListener('change', () => { const f = form.photo.files[0]; if (f) main.querySelector('#photoPreview').src = URL.createObjectURL(f); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = main.querySelector('#saveBtn'); btn.disabled = true; btn.textContent = 'ກຳລັງບັນທຶກ...';
    const fd = new FormData(form), rec = {};
    for (const k of FIELDS) rec[k] = (fd.get(k) ?? '').toString().trim() || null;
    rec.academic_year_id = Number(rec.academic_year_id);
    try {
      const file = form.photo.files[0];
      if (file) {
        if (file.size > 2 * 1024 * 1024) throw new Error('ຮູບໃຫຍ່ເກີນ 2MB');
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${file.name.split('.').pop().toLowerCase()}`;
        const { error: upErr } = await sb.storage.from('student-photos').upload(path, file, { contentType: file.type });
        if (upErr) throw upErr;
        if (s.photo_path) sb.storage.from('student-photos').remove([s.photo_path]);
        rec.photo_path = path;
      }
      let newId = s.id;
      if (isNew) { const { data, error } = await sb.from('students').insert(rec).select('id').single(); if (error) throw error; newId = data.id; }
      else { const { error } = await sb.from('students').update(rec).eq('id', s.id); if (error) throw error; }
      toast(isNew ? 'ເພີ່ມນັກສຶກສາສຳເລັດ' : 'ບັນທຶກການແກ້ໄຂແລ້ວ');
      location.hash = `#/students/${newId}`;
    } catch (err) {
      toast(isAuthError(err) ? 'Session ໝົດອາຍຸ – ກະລຸນາເຂົ້າສູ່ລະບົບໃໝ່' : 'ບັນທຶກບໍ່ສຳເລັດ: ' + (String(err.message).includes('student_code') ? 'ລະຫັດນັກສຶກສານີ້ມີແລ້ວ' : err.message), 'error');
      if (isAuthError(err)) location.hash = `#/login?next=${encodeURIComponent(location.hash)}`;
      btn.disabled = false; btn.textContent = '💾 ບັນທຶກ';
    }
  });
}

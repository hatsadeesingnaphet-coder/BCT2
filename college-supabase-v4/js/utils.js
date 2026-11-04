export const LAO_MONTHS = ['ມັງກອນ','ກຸມພາ','ມີນາ','ເມສາ','ພຶດສະພາ','ມິຖຸນາ','ກໍລະກົດ','ສິງຫາ','ກັນຍາ','ຕຸລາ','ພະຈິກ','ທັນວາ'];
const EN_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

/** '2000-09-01' → '01 ກັນຍາ 2000' */
export function laoDate(iso) { if (!iso) return ''; const [y, m, d] = iso.split('-').map(Number); return `${String(d).padStart(2, '0')} ${LAO_MONTHS[m - 1]} ${y}`; }
/** '2000-09-01' → '01 September 2000' */
export function enDate(iso) { if (!iso) return ''; const [y, m, d] = iso.split('-').map(Number); return `${String(d).padStart(2, '0')} ${EN_MONTHS[m - 1]} ${y}`; }
export function age(iso) { if (!iso) return ''; const b = new Date(iso), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; return a; }

export const genderLo = (g) => (g === 'M' ? 'ຊາຍ' : 'ຍິງ');
export const genderBadge = (g) => `<span class="badge ${g === 'M' ? 'badge-primary' : 'badge-pink'}">${genderLo(g)}</span>`;
export const fullLo = (s) => `${s.first_name_lo ?? ''} ${s.last_name_lo ?? ''}`.trim();
export const fullEn = (s) => `${s.first_name_en ?? ''} ${s.last_name_en ?? ''}`.trim();

export function esc(v) { return String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

export function toast(msg, type = 'success') {
  const el = document.createElement('div'); el.className = `toast ${type}`; el.textContent = msg;
  document.getElementById('toasts').appendChild(el); setTimeout(() => el.remove(), 3500);
}

/** #/students?year=2&q=abc → {year:'2', q:'abc'} */
export function hashQuery() { const i = location.hash.indexOf('?'); return Object.fromEntries(new URLSearchParams(i >= 0 ? location.hash.slice(i + 1) : '')); }
export function setHash(path, params = {}) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v !== '' && v != null)).toString();
  location.hash = path + (qs ? '?' + qs : '');
}
export function setTitle(t) { document.getElementById('pageTitle').textContent = t; }

export function field(label, name, value = '', { type = 'text', required = false, placeholder = '' } = {}) {
  return `<label class="f"><span>${label}${required ? ' <i class="req">*</i>' : ''}</span>
    <input class="input" type="${type}" name="${name}" value="${esc(value)}" ${required ? 'required' : ''} placeholder="${esc(placeholder)}"></label>`;
}
export function select(label, name, options, value, { required = false, blank = '' } = {}) {
  return `<label class="f"><span>${label}${required ? ' <i class="req">*</i>' : ''}</span><select name="${name}" ${required ? 'required' : ''}>
    ${blank ? `<option value="">${blank}</option>` : ''}
    ${options.map(([v, t]) => `<option value="${esc(v)}" ${String(value) === String(v) ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></label>`;
}

/** modal ຢືນຢັນ (ແທນ window.confirm) */
export function confirmDlg(title, text, { okLabel = 'ລົບ', danger = true } = {}) {
  return new Promise((resolve) => {
    const bg = document.createElement('div'); bg.className = 'modal-bg';
    bg.innerHTML = `<div class="modal"><div class="card-head"><h2>${title}</h2></div><div class="card-body"><p style="margin:0">${text}</p></div>
      <div class="foot"><button class="btn" data-x>ຍົກເລີກ</button><button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${okLabel}</button></div></div>`;
    document.body.appendChild(bg);
    const done = (v) => { bg.remove(); resolve(v); };
    bg.querySelector('[data-x]').onclick = () => done(false); bg.querySelector('[data-ok]').onclick = () => done(true);
    bg.onclick = (e) => { if (e.target === bg) done(false); };
  });
}
export const debounce = (fn, ms = 350) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

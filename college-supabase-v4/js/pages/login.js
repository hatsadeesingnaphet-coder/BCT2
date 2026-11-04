import { sb } from '../supabase.js';
import { toast, setTitle, hashQuery, esc } from '../utils.js';

export async function render({ main, user }) {
  const next = hashQuery().next || '#/';
  if (user) { location.hash = next; return; }
  setTitle('ເຂົ້າສູ່ລະບົບ');
  main.innerHTML = `
  <div class="card" style="max-width:420px;margin:40px auto">
    <div class="card-body" style="padding:32px">
      <div style="font-size:40px;text-align:center;margin-bottom:8px">🔐</div>
      <h1 class="center" style="font-size:20px">ເຂົ້າສູ່ລະບົບຜູ້ບໍລິຫານ</h1>
      <p class="center muted small" style="margin:6px 0 24px">ເພື່ອ ແກ້ໄຂ / ລົບ ຂໍ້ມູນ · ການເບິ່ງ ແລະ ເພີ່ມນັກສຶກສາ ບໍ່ຕ້ອງ login</p>
      <form id="loginForm" class="grid">
        <label class="f"><span>ອີເມວ</span><input class="input" type="email" name="email" required autofocus autocomplete="username"></label>
        <label class="f"><span>ລະຫັດຜ່ານ</span><input class="input" type="password" name="password" required autocomplete="current-password"></label>
        <button id="loginBtn" class="btn btn-primary" style="justify-content:center;padding:11px">ເຂົ້າສູ່ລະບົບ</button>
      </form>
      <a href="${esc(next)}" class="btn btn-ghost mt-2" style="width:100%;justify-content:center">← ກັບໄປເບິ່ງຂໍ້ມູນ</a>
    </div>
  </div>`;
  main.querySelector('#loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = main.querySelector('#loginBtn'); btn.disabled = true; btn.textContent = 'ກຳລັງກວດສອບ...';
    const f = new FormData(e.target);
    const { error } = await sb.auth.signInWithPassword({ email: f.get('email').trim(), password: f.get('password') });
    if (error) { toast('ອີເມວ ຫຼື ລະຫັດຜ່ານ ບໍ່ຖືກຕ້ອງ', 'error'); btn.disabled = false; btn.textContent = 'ເຂົ້າສູ່ລະບົບ'; return; }
    toast('ເຂົ້າສູ່ລະບົບສຳເລັດ'); location.hash = next;
  });
}

/** ໜ້າບັນຊີ: ປ່ຽນລະຫັດຜ່ານ */
export async function account({ main, user }) {
  setTitle('ບັນຊີຂອງຂ້ອຍ');
  main.innerHTML = `
  <div class="page-head"><div><h1>👤 ບັນຊີຜູ້ບໍລິຫານ</h1><p>${esc(user.email)}</p></div></div>
  <div class="grid" style="grid-template-columns: 420px 1fr; align-items:start">
    <form id="pwForm" class="card card-body grid"><h2>ປ່ຽນລະຫັດຜ່ານ</h2>
      <label class="f"><span>ລະຫັດຜ່ານໃໝ່</span><input class="input" type="password" name="p1" minlength="6" required autocomplete="new-password"></label>
      <label class="f"><span>ຢືນຢັນລະຫັດຜ່ານໃໝ່</span><input class="input" type="password" name="p2" minlength="6" required autocomplete="new-password"></label>
      <button class="btn btn-primary" style="justify-content:center">💾 ບັນທຶກລະຫັດຜ່ານ</button></form>
    <div class="card card-body"><h2>ເພີ່ມຜູ້ບໍລິຫານຄົນອື່ນ</h2>
      <p class="muted small">Supabase Dashboard → <b>Authentication → Users → Add user</b> → ໃສ່ email + password → ຕິກ <b>Auto Confirm User</b> → Create. ຄົນນັ້ນ login ໄດ້ທັນທີ ບໍ່ຕ້ອງຢືນຢັນຫຍັງເພີ່ມ.</p>
      <p class="muted small">ລົບຜູ້ບໍລິຫານ: ໜ້າດຽວກັນ → ⋯ → Delete user</p></div>
  </div>`;
  main.querySelector('#pwForm').addEventListener('submit', async (e) => {
    e.preventDefault(); const f = new FormData(e.target);
    if (f.get('p1') !== f.get('p2')) return toast('ລະຫັດຜ່ານທັງສອງບໍ່ກົງກັນ', 'error');
    const { error } = await sb.auth.updateUser({ password: f.get('p1') });
    if (error) return toast(error.message, 'error');
    toast('ປ່ຽນລະຫັດຜ່ານແລ້ວ'); e.target.reset();
  });
}

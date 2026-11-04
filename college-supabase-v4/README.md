# ລະບົບບໍລິຫານວິທະຍາໄລ – Supabase + HTML/JavaScript (VS Code)

ຖານຂໍ້ມູນລວມສູນ ອອນລາຍ 24 ຊົ່ວໂມງ (Supabase) · **ທຸກຄົນກົດລິ້ງ ເບິ່ງ + ເພີ່ມນັກສຶກສາ ໄດ້ເລີຍ** · **ແກ້ໄຂ/ລົບ ຕ້ອງ login ເປັນຜູ້ບໍລິຫານ** · ເມນູເພີ່ມເອງໄດ້ · ລາຍງານ · ສົ່ງອອກ Excel

| ສ່ວນ | ໃຊ້ຫຍັງ |
|---|---|
| ຖານຂໍ້ມູນ + Login + ເກັບຮູບ | **Supabase** (PostgreSQL + Auth + Storage) – ຟຣີ, ອອນລາຍຕະຫຼອດ |
| ໜ້າເວັບ | HTML + JavaScript (ES modules) + CSS ຂອງຕົນເອງ (`css/app.css`) – **ບໍ່ຕ້ອງ build, ບໍ່ຕ້ອງ server** |
| ສົ່ງອອກ Excel | SheetJS (CDN) ສ້າງ .xlsx ໃນ browser |
| Editor | VS Code + extension **Live Server** |

```
college-supabase/
├── index.html              ← app shell (sidebar + topbar), hash routing
├── css/app.css             ← ດີໄຊນ໌ທັງໝົດ – ແກ້ສີ/ຟອນ/ຂະໜາດ ຢູ່ :root ດ້ານເທິງ
├── supabase/schema.sql     ← ຕາຕະລາງ, views ລາຍງານ, storage, ຂໍ້ມູນເລີ່ມຕົ້ນ
└── js/
    ├── config.js           ← ⚠️ ໃສ່ SUPABASE_URL / ANON KEY ບ່ອນນີ້
    ├── supabase.js         ← client, photoUrl(), loadYears()
    ├── utils.js            ← laoDate(), enDate(), toast, confirm modal, helpers
    ├── nav.js              ← ເມນູຊ້າຍ dynamic ຈາກຕາຕະລາງ menus
    ├── app.js              ← router (ເພີ່ມໜ້າໃໝ່ບ່ອນນີ້)
    └── pages/
        ├── home.js         ← ພາບລວມ (stat cards, ເພີ່ມຫຼ້າສຸດ, ກຣາຟຕາມສົກຮຽນ)
        ├── students.js     ← ລາຍຊື່ (ຄົ້ນຫາສົດ, filter, sort, ແບ່ງໜ້າ) + ໜ້າປະຫວັດ (ພິມໄດ້)
        ├── student-form.js ← ເພີ່ມ/ແກ້ໄຂ (preview ຮູບ + ວັນເກີດ 2 ພາສາ, autocomplete ແຂວງ/ໂຮງຮຽນ)
        ├── reports.js      ← ລາຍງານ + exportExcel()
        ├── years.js        ← ສົກຮຽນ (admin)
        ├── menus.js        ← ຈັດການເມນູ (admin)
        └── login.js        ← ໜ້າ login + ໜ້າບັນຊີ (ປ່ຽນລະຫັດຜ່ານ)
```

---

## 1. ຕັ້ງຄ່າ Supabase (5 ນາທີ)

1. https://supabase.com → **New project** (region: Singapore) → ຕັ້ງລະຫັດ DB
2. ເມນູຊ້າຍ **SQL Editor** → New query → ວາງທັງໄຟລ໌ `supabase/schema.sql` → **Run**
3. **Authentication → Users → Add user** → ໃສ່ email + password ຂອງຜູ້ບໍລິຫານ → ✅ ຕິກ **Auto Confirm User** → Create
   (ຄົນນັ້ນ login ໄດ້ທັນທີ – ບໍ່ຕ້ອງຢືນຢັນອີເມວ, ບໍ່ຕ້ອງຕັ້ງ role, ບໍ່ຕ້ອງໃຫ້ໃຜອະນຸມັດ)
4. **Authentication → Providers → Email** → ປິດ *Allow new users to sign up* (ກັນຄົນນອກສະໝັກເອງ)
5. **Project Settings → API** → copy `Project URL` ແລະ `anon public` key

ເພີ່ມຜູ້ບໍລິຫານຄົນຕໍ່ໄປ = ຂໍ້ 3 ຊ້ຳ. ລົບ = ໜ້າດຽວກັນ → Delete user

## 2. ເປິດໃນ VS Code

1. ເປິດໂຟນເດີໃນ VS Code → ແກ້ `js/config.js`:
   ```js
   export const SUPABASE_URL = 'https://xxxx.supabase.co';
   export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
   export const APP_NAME = 'ວິທະຍາໄລ ...';
   ```
2. ຕິດຕັ້ງ extension **Live Server** → ຄລິກຂວາ `index.html` → **Open with Live Server**
   (ຕ້ອງເປີດຜ່ານ http:// – double-click ໄຟລ໌ໂດຍກົງບໍ່ໄດ້ ເພາະໃຊ້ ES modules)
3. ເປິດ http://127.0.0.1:5500 → ໜ້າພາບລວມ → ＋ ເພີ່ມນັກສຶກສາ

## 3. ເອົາຂຶ້ນອອນລາຍ (ຟຣີ)

ເວັບເປັນ static ລ້ວນ – ວາງບ່ອນໃດກໍໄດ້:

| ບໍລິການ | ວິທີ |
|---|---|
| **Netlify** | ລາກໂຟນເດີໃສ່ app.netlify.com/drop → ໄດ້ URL ທັນທີ |
| **Vercel** | `npx vercel` ໃນໂຟນເດີ |
| **GitHub Pages** | push → Settings → Pages |
| **Cloudflare Pages** | upload ໂດຍກົງ |

Supabase ອອນລາຍຢູ່ແລ້ວ. Free tier: 500 MB DB, 1 GB storage (ຮູບ ~3,000–5,000 ຮູບ)

## 3.1 ສິດການເຂົ້າໃຊ້

| | ຜູ້ເຂົ້າຊົມ (ກົດລິ້ງ) | ຜູ້ບໍລິຫານ (login ແລ້ວ) |
|---|---|---|
| ເບິ່ງລາຍຊື່ / ປະຫວັດ / ລາຍງານ / Excel | ✅ | ✅ |
| ເພີ່ມນັກສຶກສາ | ✅ | ✅ |
| ແກ້ໄຂ / ລົບ ນັກສຶກສາ | ❌ (ປຸ່ມບໍ່ປາກົດ) | ✅ |
| ສົກຮຽນ / ຈັດການເມນູ | ❌ (ເມນູບໍ່ປາກົດ) | ✅ |

ປ້ອງກັນ 2 ຊັ້ນ: ໜ້າເວັບເຊື່ອງປຸ່ມ **ແລະ** Postgres RLS ອະນຸຍາດໃຫ້ anon ສະເພາະ insert ນັກສຶກສາ ແລະ ປະຕິເສດ update/delete ຈາກຜູ້ທີ່ບໍ່ໄດ້ login ເຖິງຈະເອີ້ນ API ໂດຍກົງ. Session ຈື່ໄວ້ໃນ browser – ປິດເປີດໃໝ່ບໍ່ຕ້ອງ login ຊ້ຳ. ປ່ຽນລະຫັດຜ່ານໄດ້ທີ່ໜ້າ 👤 ບັນຊີ (ກົດອີເມວຢູ່ລຸ່ມແຖບຊ້າຍ).

## 4. ຖານຂໍ້ມູນ

- `academic_years` – ລ/ດ, ສົກຮຽນ (`2026-2027`), `is_current` (trigger ບັງຄັບມີອັນດຽວ)
- `students` – ປະຫວັດນັກສຶກສາ ຄົບ 14 ຂໍ້ມູນ (ຮູບ, ຊື່ ລາວ/ອັງກິດ, ເພດ, ວັນເກີດ, ບ້ານ/ເມືອງ/ແຂວງ, ມ.ສ, ເບີໂທ 4 ເບີ)
- `menus` – ເມນູ dynamic (parent/child, ລຳດັບ, ເປິດ/ປິດ, `is_admin_only` ສະແດງສະເພາະຫຼັງ login)

**ວັນເດືອນປີເກີດ** ເກັບ `date` ຖັນດຽວ → ສະແດງ 2 ພາສາ: SQL `lao_date()` + `to_char(..,'DD FMMonth YYYY')` / JS `laoDate()` `enDate()`

**Views ລາຍງານ**: `v_students_report` (ຫົວຖັນພາສາລາວ ພ້ອມ Excel), `v_report_by_year`, `v_report_by_province`, `v_report_by_school`

## 5. ປັບດີໄຊນ໌

ທຸກສີ/ຟອນ/ມຸມໂຄ້ງ ຢູ່ `css/app.css` ບລັອກ `:root` ດ້ານເທິງ ເຊັ່ນ `--primary: #4f46e5;` ປ່ຽນສີຫຼັກທັງແອັບ · `--sidebar` ສີແຖບຊ້າຍ · logo ແກ້ emoji ໃນ `index.html` (`.brand .logo`)

## 6. ເພີ່ມເມນູ / ໜ້າໃໝ່

1. ສ້າງ `js/pages/majors.js` export `render({ main, params })`
2. ເພີ່ມໃນ `js/app.js`: `{ re: /^#\/majors/, page: majors.render }` (ໃສ່ `auth: true` ຖ້າຕ້ອງ login)
3. ໜ້າ ☰ ຈັດການເມນູ → ເພີ່ມ URL `#/majors` → ປາກົດແຖບຊ້າຍທັນທີ (ລິ້ງພາຍນອກ https:// ກໍໄດ້)

## 7. ຂັ້ນຕໍ່ໄປທີ່ແນະນຳ
- ຕາຕະລາງ `provinces`/`districts` (ຕອນນີ້ໃຊ້ autocomplete ຈາກຂໍ້ມູນທີ່ເຄີຍພິມ)
- Import ນັກສຶກສາຈາກ Excel (SheetJS ອ່ານ .xlsx ໄດ້)
- `majors`, `classes`, `enrollments` → ລະບົບຄະແນນ / ຄ່າຮຽນ
- Backup: Supabase → Database → Backups (Pro) ຫຼື `pg_dump` ຜ່ານ connection string

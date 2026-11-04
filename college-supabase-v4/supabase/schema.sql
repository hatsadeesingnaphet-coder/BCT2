-- =====================================================================
--  ລະບົບບໍລິຫານວິທະຍາໄລ – Supabase (PostgreSQL) schema  (ທຸກຄົນ ເບິ່ງ + ເພີ່ມນັກສຶກສາ ໄດ້ · ແກ້ໄຂ/ລົບ ຕ້ອງ login ເປັນຜູ້ບໍລິຫານ)
--  ວິທີໃຊ້: Supabase Dashboard → SQL Editor → ວາງທັງໄຟລ໌ → Run
-- =====================================================================

-- ---------- 1. ຕາຕະລາງ ----------

-- ສົກຮຽນ   ຕົວຢ່າງ: 1 | 2026-2027
create table if not exists public.academic_years (
  id          bigint generated always as identity primary key,
  name        text not null unique check (name ~ '^\d{4}-\d{4}$'),
  is_current  boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ປະຫວັດນັກສຶກສາ
create table if not exists public.students (
  id                bigint generated always as identity primary key,
  academic_year_id  bigint not null references public.academic_years(id) on update cascade on delete restrict,
  student_code      text unique,                 -- ລະຫັດນັກສຶກສາ
  photo_path        text,                        -- path ໃນ storage bucket student-photos
  first_name_lo     text not null,               -- ຊື່ (ລາວ)
  last_name_lo      text not null,               -- ນາມສະກຸນ (ລາວ)
  first_name_en     text not null,               -- ຊື່ (ອັງກິດ)
  last_name_en      text not null,               -- ນາມສະກຸນ (ອັງກິດ)
  gender            char(1) not null check (gender in ('M','F')),
  dob               date not null,               -- ວັນເກີດ (ສະແດງ ລາວ/ອັງກິດ ຜ່ານ view)
  birth_village     text,                        -- ບ້ານ
  birth_district    text,                        -- ເມືອງ
  birth_province    text,                        -- ແຂວງ
  high_school       text,                        -- ຈົບ ມ.7 ຈາກ ມ.ສ ໃດ
  phone             text,
  father_phone      text,
  mother_phone      text,
  emergency_phone   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists students_year_gender_idx on public.students (academic_year_id, gender);
create index if not exists students_province_idx on public.students (birth_province);

-- ເມນູ dynamic – ເພີ່ມເມນູຜ່ານໜ້າ ☰ ເມນູ ບໍ່ຕ້ອງແກ້ code
create table if not exists public.menus (
  id          bigint generated always as identity primary key,
  parent_id   bigint references public.menus(id) on delete set null,
  title       text not null,
  icon        text,
  url         text,                              -- ເຊັ່ນ #/students, #/reports, https://...
  sort_order  int not null default 0,
  is_admin_only boolean not null default false,   -- ສະແດງສະເພາະຫຼັງ login
  is_active   boolean not null default true
);

-- updated_at ອັດຕະໂນມັດ
create or replace function public.set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists students_updated_at on public.students;
create trigger students_updated_at before update on public.students
  for each row execute function public.set_updated_at();

-- ສົກຮຽນປັດຈຸບັນ ມີໄດ້ອັນດຽວ
create or replace function public.single_current_year() returns trigger language plpgsql as $$
begin
  if new.is_current then update public.academic_years set is_current = false where id <> new.id and is_current; end if;
  return new;
end $$;
drop trigger if exists academic_years_single_current on public.academic_years;
create trigger academic_years_single_current after insert or update of is_current on public.academic_years
  for each row when (new.is_current) execute function public.single_current_year();

-- ---------- 2. ວັນທີພາສາລາວ: 2000-09-01 → '01 ກັນຍາ 2000' ----------
create or replace function public.lao_date(d date) returns text language sql immutable as $$
  select case when d is null then null else
    to_char(d, 'DD') || ' ' ||
    (array['ມັງກອນ','ກຸມພາ','ມີນາ','ເມສາ','ພຶດສະພາ','ມິຖຸນາ','ກໍລະກົດ','ສິງຫາ','ກັນຍາ','ຕຸລາ','ພະຈິກ','ທັນວາ'])[extract(month from d)::int]
    || ' ' || to_char(d, 'YYYY') end;
$$;

-- ---------- 3. Views ສຳລັບລາຍງານ / Excel ----------
create or replace view public.v_students_report as
select
  s.id,
  s.student_code                                   as "ລະຫັດ",
  ay.name                                          as "ສົກຮຽນ",
  s.first_name_lo || ' ' || s.last_name_lo         as "ຊື່ ແລະ ນາມສະກຸນ (ລາວ)",
  s.first_name_en || ' ' || s.last_name_en         as "Name (English)",
  case s.gender when 'M' then 'ຊາຍ' else 'ຍິງ' end as "ເພດ",
  public.lao_date(s.dob)                           as "ວັນເດືອນປີເກີດ (ລາວ)",
  to_char(s.dob, 'DD FMMonth YYYY')                as "Date of Birth (EN)",
  s.birth_village                                  as "ບ້ານ",
  s.birth_district                                 as "ເມືອງ",
  s.birth_province                                 as "ແຂວງ",
  s.high_school                                    as "ຈົບ ມ.7 ຈາກ",
  s.phone                                          as "ເບີໂທ",
  s.father_phone                                   as "ເບີໂທພໍ່",
  s.mother_phone                                   as "ເບີໂທແມ່",
  s.emergency_phone                                as "ເບີໂທສຸກເສີນ",
  s.academic_year_id, s.gender, s.birth_province as province_key
from public.students s
join public.academic_years ay on ay.id = s.academic_year_id
order by ay.name, s.id;

create or replace view public.v_report_by_year as
select ay.id as academic_year_id, ay.name,
       count(*) filter (where s.gender = 'M') as male,
       count(*) filter (where s.gender = 'F') as female,
       count(s.id) as total
from public.academic_years ay left join public.students s on s.academic_year_id = ay.id
group by ay.id, ay.name order by ay.name;

create or replace view public.v_report_by_province as
select academic_year_id, coalesce(birth_province, '— ບໍ່ລະບຸ —') as province, count(*) as total
from public.students group by academic_year_id, birth_province;

create or replace view public.v_report_by_school as
select academic_year_id, high_school, count(*) as total
from public.students where high_school is not null group by academic_year_id, high_school;

-- ---------- 4. ສິດການເຂົ້າໃຊ້ ----------
--  ທຸກຄົນ: ອ່ານທຸກຕາຕະລາງ + ເພີ່ມນັກສຶກສາ (insert) + ອັບໂຫລດຮູບ
--  ຜູ້ບໍລິຫານ (login ແລ້ວ): ແກ້ໄຂ / ລົບ ນັກສຶກສາ, ຈັດການສົກຮຽນ + ເມນູ
--  ຜູ້ບໍລິຫານ = user ໃນ Authentication → Users (ສ້າງຈາກ Dashboard, ຕິກ Auto Confirm) – ບໍ່ຕ້ອງຕັ້ງ role ເພີ່ມ
alter table public.academic_years enable row level security;
alter table public.students       enable row level security;
alter table public.menus          enable row level security;

do $$ declare t text; begin
  foreach t in array array['academic_years','students','menus'] loop
    execute format('drop policy if exists "open access" on public.%I', t);
    execute format('drop policy if exists "public read" on public.%I', t);
    execute format('create policy "public read" on public.%I for select using (true)', t);
    execute format('drop policy if exists "admin write" on public.%I', t);
    execute format('create policy "admin write" on public.%I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- ທຸກຄົນ (ບໍ່ login) ເພີ່ມນັກສຶກສາໄດ້ – ແຕ່ແກ້/ລົບ ບໍ່ໄດ້
drop policy if exists "public insert" on public.students;
create policy "public insert" on public.students for insert to anon with check (true);

-- ---------- 5. Storage: ຮູບນັກສຶກສາ (ທຸກຄົນເບິ່ງ / admin ອັບໂຫລດ-ລົບ) ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('student-photos', 'student-photos', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = array['image/jpeg','image/png','image/webp'];

drop policy if exists "photos open" on storage.objects;
drop policy if exists "photos public read" on storage.objects;
create policy "photos public read" on storage.objects for select using (bucket_id = 'student-photos');
drop policy if exists "photos public upload" on storage.objects;
create policy "photos public upload" on storage.objects for insert with check (bucket_id = 'student-photos');
drop policy if exists "photos admin write" on storage.objects;
create policy "photos admin write" on storage.objects for all to authenticated
  using (bucket_id = 'student-photos') with check (bucket_id = 'student-photos');

-- ---------- 6. ຂໍ້ມູນເລີ່ມຕົ້ນ ----------
insert into public.academic_years (name, is_current) values ('2025-2026', false), ('2026-2027', true)
on conflict (name) do nothing;

insert into public.menus (title, icon, url, sort_order, is_admin_only)
select * from (values
  ('ພາບລວມ',          '🏠', '#/',         0, false),
  ('ນັກສຶກສາ',        '🎓', '#/students', 1, false),
  ('ລາຍງານ',          '📊', '#/reports',  2, false),
  ('ສົກຮຽນ',          '📅', '#/years',    3, true),
  ('ຈັດການເມນູ',      '☰',  '#/menus',    9, true)
) v(title, icon, url, sort_order, is_admin_only)
where not exists (select 1 from public.menus);

-- ---------- 7. ສ້າງຜູ້ບໍລິຫານ ----------
-- Dashboard → Authentication → Users → Add user → ໃສ່ email + password → ✅ ຕິກ "Auto Confirm User" → Create
-- (ແນະນຳ: Authentication → Providers → Email → ປິດ "Allow new users to sign up" ກັນຄົນນອກສະໝັກເອງ)

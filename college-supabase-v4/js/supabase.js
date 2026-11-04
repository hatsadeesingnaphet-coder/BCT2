import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const sb = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function photoUrl(path, name = '') {
  if (path) return sb.storage.from('student-photos').getPublicUrl(path).data.publicUrl;
  return `https://ui-avatars.com/api/?size=256&background=eef2ff&color=4f46e5&name=${encodeURIComponent(name || 'S')}`;
}

export async function loadYears() {
  const { data } = await sb.from('academic_years').select('*').order('name', { ascending: false });
  return data ?? [];
}

/** ຜູ້ login ປັດຈຸບັນ (null = ຜູ້ເຂົ້າຊົມທົ່ວໄປ) */
export async function currentUser() {
  const { data: { session } } = await sb.auth.getSession();
  return session?.user ?? null;
}
/** ຖ້າ Supabase ຕອບ RLS error ແປວ່າບໍ່ໄດ້ login / session ໝົດອາຍຸ */
export const isAuthError = (e) => e && (e.code === '42501' || /row-level security|JWT|not authorized/i.test(e.message ?? ''));

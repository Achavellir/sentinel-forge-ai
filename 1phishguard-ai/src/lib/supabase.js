import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseConfigured =
  Boolean(rawUrl && rawAnonKey) &&
  !rawUrl.includes('yourproject') &&
  !rawAnonKey.includes('your_anon_key');

const supabaseUrl = rawUrl || 'https://placeholder.supabase.co';
const supabaseAnonKey = rawAnonKey || 'placeholder-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

function requireSupabase() {
  if (!supabaseConfigured) {
    throw new Error('Supabase is not configured. Add your project URL and anon key to .env.');
  }
}

export async function getProfile(userId) {
  requireSupabase();
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, updates) {
  requireSupabase();
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

export async function canScan(userId) {
  const profile = await getProfile(userId);
  if (profile.plan !== 'free') return { allowed: true, profile };
  if (profile.scans_used >= profile.scans_limit) {
    return { allowed: false, profile, reason: 'limit_reached' };
  }
  return { allowed: true, profile };
}

export async function recordScan(userId, scanData) {
  requireSupabase();
  const { error: scanError } = await supabase.from('scans').insert({
    user_id: userId,
    email_preview: scanData.emailPreview,
    verdict: scanData.verdict,
    risk_score: scanData.riskScore,
    result_json: scanData.result,
  });

  if (scanError) throw scanError;

  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  if (profile?.plan === 'free') {
    await supabase.rpc('increment_scan_count', { user_id: userId });
  }
}

export async function fetchScans(userId, limit = 50) {
  requireSupabase();
  const { data, error } = await supabase
    .from('scans')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
}

export async function deleteScan(scanId) {
  requireSupabase();
  const { error } = await supabase.from('scans').delete().eq('id', scanId);
  if (error) throw error;
}

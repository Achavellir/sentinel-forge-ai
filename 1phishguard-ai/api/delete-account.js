import { authenticate, getSupabaseAdmin, send } from './_utils.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const supabase = getSupabaseAdmin();
    const user = await authenticate(req, supabase);

    await supabase.from('team_members').delete().eq('user_id', user.id);
    await supabase.from('teams').delete().eq('owner_id', user.id);
    await supabase.from('scans').delete().eq('user_id', user.id);
    await supabase.from('profiles').delete().eq('id', user.id);

    const { error } = await supabase.auth.admin.deleteUser(user.id);
    if (error) throw error;

    return send(res, 200, { deleted: true });
  } catch (err) {
    console.error('Delete account error:', err);
    return send(res, 500, { error: err.message });
  }
}

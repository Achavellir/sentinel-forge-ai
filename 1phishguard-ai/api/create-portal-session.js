import Stripe from 'stripe';
import { authenticate, getAppUrl, getSupabaseAdmin, readJson, send } from './_utils.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const supabase = getSupabaseAdmin();
    const authUser = await authenticate(req, supabase);
    const { userId } = await readJson(req);

    if (!userId) return send(res, 400, { error: 'Missing userId' });
    if (authUser.id !== userId) return send(res, 403, { error: 'Cannot open billing for another user.' });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    if (!profile?.stripe_customer_id) {
      return send(res, 400, { error: 'No billing account found. Please subscribe first.' });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${getAppUrl(req)}/dashboard/settings`,
    });

    return send(res, 200, { url: portalSession.url });
  } catch (err) {
    console.error('Portal session error:', err);
    return send(res, 500, { error: err.message });
  }
}

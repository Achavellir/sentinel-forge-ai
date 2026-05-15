import Stripe from 'stripe';
import {
  authenticate,
  getAppUrl,
  getPlanFromPriceId,
  getSupabaseAdmin,
  readJson,
  send,
  validPriceIds,
} from './_utils.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const planRank = { free: 0, pro: 1, business: 2 };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const supabase = getSupabaseAdmin();
    const authUser = await authenticate(req, supabase);
    const { priceId, userId, userEmail, planName, billingPeriod } = await readJson(req);

    if (!priceId || !userId || !userEmail) {
      return send(res, 400, { error: 'Missing required fields' });
    }
    if (authUser.id !== userId) {
      return send(res, 403, { error: 'Cannot create checkout for another user.' });
    }
    if (!validPriceIds().includes(priceId)) {
      return send(res, 400, { error: 'Invalid Stripe price ID.' });
    }

    const resolvedPlan = getPlanFromPriceId(priceId);
    if (resolvedPlan !== planName) {
      return send(res, 400, { error: 'Price ID does not match selected plan.' });
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, plan')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;
    if (profile?.plan === planName) {
      return send(res, 400, { error: 'You are already on this plan.' });
    }
    if (planRank[profile?.plan || 'free'] > planRank[planName]) {
      return send(res, 400, { error: 'Use the billing portal to downgrade plans.' });
    }

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { supabase_user_id: userId },
      });
      customerId = customer.id;
      await supabase.from('profiles').update({ stripe_customer_id: customerId }).eq('id', userId);
    }

    const appUrl = getAppUrl(req);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout/cancel`,
      subscription_data: {
        metadata: {
          supabase_user_id: userId,
          plan: planName,
          billing_period: billingPeriod,
        },
        trial_period_days: 0,
      },
      metadata: {
        supabase_user_id: userId,
        plan: planName,
        billing_period: billingPeriod,
      },
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      customer_update: { address: 'auto' },
    });

    return send(res, 200, { url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Checkout session error:', err);
    return send(res, 500, { error: err.message });
  }
}

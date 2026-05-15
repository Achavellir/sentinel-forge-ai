import Stripe from 'stripe';
import { authenticate, getSupabaseAdmin, readJson, send } from './_utils.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const supabase = getSupabaseAdmin();
    const authUser = await authenticate(req, supabase);
    const { userId } = await readJson(req);

    if (!userId) return send(res, 400, { error: 'Missing userId' });
    if (authUser.id !== userId) return send(res, 403, { error: 'Cannot read billing for another user.' });

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan, stripe_customer_id, stripe_subscription_id, payment_failed')
      .eq('id', userId)
      .single();
    if (profileError) throw profileError;

    if (!profile?.stripe_subscription_id) {
      return send(res, 200, {
        plan: profile?.plan || 'free',
        paymentFailed: profile?.payment_failed || false,
        nextBillingDate: null,
        cardLast4: null,
      });
    }

    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id, {
      expand: ['default_payment_method'],
    });
    let cardLast4 = subscription.default_payment_method?.card?.last4 || null;

    if (!cardLast4 && profile.stripe_customer_id) {
      const methods = await stripe.paymentMethods.list({
        customer: profile.stripe_customer_id,
        type: 'card',
        limit: 1,
      });
      cardLast4 = methods.data[0]?.card?.last4 || null;
    }

    return send(res, 200, {
      plan: profile.plan,
      paymentFailed: profile.payment_failed,
      nextBillingDate: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
      cardLast4,
    });
  } catch (err) {
    console.error('Billing status error:', err);
    return send(res, 500, { error: err.message });
  }
}

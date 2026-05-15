import Stripe from 'stripe';
import {
  PLAN_LIMITS,
  getPlanFromPriceId,
  getSupabaseAdmin,
  readRawBody,
  send,
} from './_utils.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function updateProfileForCustomer(supabase, customerId, updates, userId) {
  if (userId) {
    return supabase.from('profiles').update(updates).eq('id', userId);
  }
  return supabase.from('profiles').update(updates).eq('stripe_customer_id', customerId);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    const supabase = getSupabaseAdmin();

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        const userId = session.metadata?.supabase_user_id;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const priceId = subscription.items.data[0].price.id;
        const plan = getPlanFromPriceId(priceId);
        const limits = PLAN_LIMITS[plan];

        await updateProfileForCustomer(
          supabase,
          customerId,
          {
            plan: limits.plan,
            scans_limit: limits.scans_limit,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            scans_used: 0,
            payment_failed: false,
          },
          userId,
        );
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const priceId = subscription.items.data[0].price.id;
        const plan = getPlanFromPriceId(priceId);
        const limits = PLAN_LIMITS[plan];
        const userId = subscription.metadata?.supabase_user_id;

        if (subscription.status === 'active' || subscription.status === 'trialing') {
          await updateProfileForCustomer(
            supabase,
            customerId,
            {
              plan: limits.plan,
              scans_limit: limits.scans_limit,
              stripe_subscription_id: subscription.id,
              payment_failed: false,
            },
            userId,
          );
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await updateProfileForCustomer(supabase, subscription.customer, {
          plan: 'free',
          scans_limit: 5,
          scans_used: 0,
          stripe_subscription_id: null,
          payment_failed: false,
        });
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        await updateProfileForCustomer(supabase, invoice.customer, { payment_failed: true });
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        await updateProfileForCustomer(supabase, invoice.customer, {
          payment_failed: false,
          scans_used: 0,
        });
        break;
      }

      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    return send(res, 200, { received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    return send(res, 500, { error: err.message });
  }
}

export const config = {
  api: { bodyParser: false },
};

import { supabase } from './supabase';

const API_BASE = import.meta.env.VITE_APP_URL || '';

export const PRICE_IDS = {
  pro: {
    monthly: import.meta.env.VITE_STRIPE_PRO_PRICE_ID,
    annual: import.meta.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID,
  },
  business: {
    monthly: import.meta.env.VITE_STRIPE_BUSINESS_PRICE_ID,
    annual: import.meta.env.VITE_STRIPE_BUSINESS_ANNUAL_PRICE_ID,
  },
};

export async function startCheckout({ priceId, planName, billingPeriod = 'monthly' }) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (authError || !user) throw new Error('You must be logged in to upgrade.');
  if (!priceId || priceId.includes('xxxxx')) {
    throw new Error('Stripe price ID is missing. Add it to .env or Vercel env variables.');
  }

  const response = await fetch(`${API_BASE}/api/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({
      priceId,
      userId: user.id,
      userEmail: user.email,
      planName,
      billingPeriod,
    }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Checkout failed');

  window.location.href = data.url;
}

export async function openBillingPortal() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (authError || !user) throw new Error('You must be logged in.');

  const response = await fetch(`${API_BASE}/api/create-portal-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ userId: user.id }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not open billing portal');

  window.location.href = data.url;
}

export async function fetchBillingStatus() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (authError || !user) throw new Error('You must be logged in.');

  const response = await fetch(`${API_BASE}/api/billing-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session?.access_token}`,
    },
    body: JSON.stringify({ userId: user.id }),
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not load billing status');
  return data;
}

import { createClient } from '@supabase/supabase-js';

export const PLAN_LIMITS = {
  free: { plan: 'free', scans_limit: 5 },
  pro: { plan: 'pro', scans_limit: 999999 },
  business: { plan: 'business', scans_limit: 999999 },
};

export function getEnv(...names) {
  for (const name of names) {
    const value = process.env[name];
    if (value && !value.includes('xxxxx') && !value.includes('your_')) return value;
  }
  return '';
}

export function getAppUrl(req) {
  return (
    getEnv('VITE_APP_URL') ||
    `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers['x-forwarded-host'] || req.headers.host}`
  ).replace(/\/$/, '');
}

export function getPlanFromPriceId(priceId) {
  if (priceId === process.env.VITE_STRIPE_PRO_PRICE_ID || priceId === process.env.STRIPE_PRO_PRICE_ID) {
    return 'pro';
  }
  if (
    priceId === process.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID ||
    priceId === process.env.STRIPE_PRO_ANNUAL_PRICE_ID
  ) {
    return 'pro';
  }
  if (
    priceId === process.env.VITE_STRIPE_BUSINESS_PRICE_ID ||
    priceId === process.env.STRIPE_BUSINESS_PRICE_ID
  ) {
    return 'business';
  }
  if (
    priceId === process.env.VITE_STRIPE_BUSINESS_ANNUAL_PRICE_ID ||
    priceId === process.env.STRIPE_BUSINESS_ANNUAL_PRICE_ID
  ) {
    return 'business';
  }
  return 'free';
}

export function validPriceIds() {
  return [
    process.env.VITE_STRIPE_PRO_PRICE_ID,
    process.env.VITE_STRIPE_PRO_ANNUAL_PRICE_ID,
    process.env.VITE_STRIPE_BUSINESS_PRICE_ID,
    process.env.VITE_STRIPE_BUSINESS_ANNUAL_PRICE_ID,
    process.env.STRIPE_PRO_PRICE_ID,
    process.env.STRIPE_BUSINESS_PRICE_ID,
  ].filter(Boolean);
}

export function getSupabaseAdmin() {
  const supabaseUrl = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL');
  const serviceRoleKey = getEnv('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase server environment variables are missing.');
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export async function readRawBody(req) {
  if (Buffer.isBuffer(req.body) || typeof req.body === 'string') return req.body;
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
  const raw = await readRawBody(req);
  const text = Buffer.isBuffer(raw) ? raw.toString('utf8') : raw;
  return text ? JSON.parse(text) : {};
}

export async function authenticate(req, supabase = getSupabaseAdmin()) {
  const header = req.headers.authorization || req.headers.Authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new Error('Missing authorization token.');
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) throw new Error('Invalid authorization token.');
  return user;
}

export function send(res, status, payload) {
  res.status(status).json(payload);
}

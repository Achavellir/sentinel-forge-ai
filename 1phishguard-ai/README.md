# 1PhishGuard AI

Production-ready full-stack SaaS starter for AI phishing email detection.

## Stack

- React + Vite
- Tailwind CSS
- React Router
- Supabase Auth, Postgres, RLS, Storage
- Stripe Checkout, subscriptions, Customer Portal, webhooks
- Anthropic Claude `claude-sonnet-4-20250514`
- Vercel serverless functions

## Run locally

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

## Environment

Copy `.env.example` to `.env` and replace every placeholder.

Use `ANTHROPIC_API_KEY` for production. `VITE_ANTHROPIC_API_KEY` is included only because the original spec listed it; the React app never reads it, so the key stays server-side.

## Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql` in SQL Editor.
3. Enable Google OAuth in Authentication providers.
4. Create the `avatars` bucket if the SQL did not create it automatically.
5. Copy project URL, anon key, and service role key into `.env` and Vercel.

## Stripe

1. Create four recurring prices:
   - Pro monthly: `$9/mo`
   - Pro annual: `$86.40/yr`
   - Business monthly: `$29/mo`
   - Business annual: `$278.40/yr`
2. Copy Price IDs to `.env`.
3. Add a webhook endpoint at `https://1phishguard.io/api/webhook`.
4. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
   - `invoice.payment_succeeded`
5. Copy the webhook signing secret to `.env`.

## Deploy

```bash
vercel deploy
```

Add the same environment variables in Vercel Project Settings before promoting production.

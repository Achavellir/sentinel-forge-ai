import { useMemo, useState } from 'react';
import { CheckCircle2, ChevronDown, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MarketingLayout } from '../components/MarketingLayout';
import { SEO } from '../components/SEO';
import { Badge, Button, Card } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { billingFaqs, planCatalog } from '../data/marketing';
import { PRICE_IDS, startCheckout } from '../lib/stripe';

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState(null);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const billingPeriod = annual ? 'annual' : 'monthly';

  const plans = useMemo(
    () =>
      planCatalog.map((plan) => ({
        ...plan,
        displayPrice: plan.price === 0 ? 0 : annual ? Math.round(plan.price * 12 * 0.8) : plan.price,
        suffix: plan.price === 0 ? '/mo' : annual ? '/yr' : '/mo',
      })),
    [annual],
  );

  async function handlePlan(plan) {
    if (plan.id === 'free') {
      navigate(user ? '/dashboard' : '/signup');
      return;
    }
    if (!user) {
      navigate('/signup', { state: { plan: plan.id } });
      return;
    }
    setLoadingPlan(plan.id);
    try {
      await startCheckout({
        priceId: PRICE_IDS[plan.id]?.[billingPeriod],
        planName: plan.id,
        billingPeriod,
      });
    } catch (error) {
      toast.error(error.message);
      setLoadingPlan(null);
    }
  }

  return (
    <MarketingLayout>
      <SEO
        title="Pricing"
        description="Simple pricing for 1PhishGuard AI: Free, Pro, and Business plans with monthly or annual Stripe subscriptions."
      />
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge className="border-cyan/40 bg-cyan/10 text-cyan">
            <ShieldCheck className="h-3.5 w-3.5" />
            PGA Pricing
          </Badge>
          <h1 className="mt-5 text-4xl font-black text-white md:text-6xl">Phishing protection that fits your workflow</h1>
          <p className="mt-5 text-lg text-slate-400">
            Start free, unlock unlimited scans with Pro, or give your company a shared security workspace with Business.
          </p>
          <div className="mx-auto mt-8 inline-flex items-center rounded-lg border border-slate-800 bg-slate-950/80 p-1">
            <button
              type="button"
              className={`rounded-lg px-4 py-2 font-mono text-sm font-bold transition ${!annual ? 'bg-primary text-white' : 'text-slate-400'}`}
              onClick={() => setAnnual(false)}
            >
              Monthly
            </button>
            <button
              type="button"
              className={`rounded-lg px-4 py-2 font-mono text-sm font-bold transition ${annual ? 'bg-primary text-white' : 'text-slate-400'}`}
              onClick={() => setAnnual(true)}
            >
              Annual -20%
            </button>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={plan.popular ? 'relative border-primary/50 shadow-glow' : 'relative'}>
              {plan.popular && (
                <Badge className="absolute right-5 top-5 border-cyan/40 bg-cyan/10 text-cyan">Most Popular</Badge>
              )}
              <h2 className="text-2xl font-black text-white">{plan.name}</h2>
              <p className="mt-2 min-h-12 text-sm text-slate-400">{plan.description}</p>
              <p className="mt-6 text-5xl font-black text-white">
                ${plan.displayPrice}
                <span className="text-base font-medium text-slate-500">{plan.suffix}</span>
              </p>
              {annual && plan.price > 0 && (
                <p className="mt-2 text-sm text-cyan">Equivalent to ${Math.round(plan.price * 0.8)}/month.</p>
              )}
              <ul className="mt-7 grid gap-3 text-sm text-slate-300">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-7 w-full"
                variant={plan.popular ? 'primary' : 'secondary'}
                loading={loadingPlan === plan.id}
                onClick={() => handlePlan(plan)}
              >
                {plan.cta}
              </Button>
            </Card>
          ))}
        </div>

        <div className="mx-auto mt-14 max-w-3xl">
          <h2 className="text-center text-2xl font-black text-white">Billing FAQ</h2>
          <div className="mt-6 grid gap-3">
            {billingFaqs.map((faq) => (
              <details key={faq.question} className="glass rounded-lg p-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-white">
                  {faq.question}
                  <ChevronDown className="h-4 w-4 text-cyan" />
                </summary>
                <p className="mt-3 text-sm leading-6 text-slate-400">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ShieldCheck } from 'lucide-react';
import { MarketingLayout } from '../../components/MarketingLayout';
import { SEO } from '../../components/SEO';
import { Button, Card } from '../../components/ui';

export default function PaymentSuccess() {
  useEffect(() => {
    confetti({ particleCount: 160, spread: 72, origin: { y: 0.66 } });
  }, []);

  return (
    <MarketingLayout>
      <SEO title="Payment Success" description="Your 1PhishGuard AI subscription is active." />
      <section className="grid min-h-[70vh] place-items-center px-4 py-16">
        <Card className="max-w-lg text-center">
          <ShieldCheck className="mx-auto h-14 w-14 text-safe" />
          <h1 className="mt-5 text-4xl font-black text-white">You're now on Pro!</h1>
          <p className="mt-3 text-slate-400">Your subscription is active. Stripe will notify PGA as soon as the webhook completes.</p>
          <Button to="/dashboard" className="mt-6">
            Go to Dashboard
          </Button>
        </Card>
      </section>
    </MarketingLayout>
  );
}

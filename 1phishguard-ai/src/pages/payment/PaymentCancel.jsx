import { XCircle } from 'lucide-react';
import { MarketingLayout } from '../../components/MarketingLayout';
import { SEO } from '../../components/SEO';
import { Button, Card } from '../../components/ui';

export default function PaymentCancel() {
  return (
    <MarketingLayout>
      <SEO title="Payment Cancelled" description="Your 1PhishGuard AI checkout was cancelled." />
      <section className="grid min-h-[70vh] place-items-center px-4 py-16">
        <Card className="max-w-lg text-center">
          <XCircle className="mx-auto h-14 w-14 text-suspicious" />
          <h1 className="mt-5 text-4xl font-black text-white">Payment cancelled</h1>
          <p className="mt-3 text-slate-400">No changes were made to your subscription.</p>
          <Button to="/pricing" className="mt-6" variant="secondary">
            Go back to Pricing
          </Button>
        </Card>
      </section>
    </MarketingLayout>
  );
}

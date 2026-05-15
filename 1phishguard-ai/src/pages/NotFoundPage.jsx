import { ShieldX } from 'lucide-react';
import { MarketingLayout } from '../components/MarketingLayout';
import { SEO } from '../components/SEO';
import { Button, Card } from '../components/ui';

export default function NotFoundPage() {
  return (
    <MarketingLayout>
      <SEO title="404" description="Page not found in 1PhishGuard AI." />
      <section className="grid min-h-[70vh] place-items-center px-4 py-16">
        <Card className="max-w-lg text-center">
          <ShieldX className="mx-auto h-14 w-14 text-cyan" />
          <h1 className="mt-5 text-5xl font-black text-white">404</h1>
          <p className="mt-3 text-slate-400">That route is not in the threat map.</p>
          <Button to="/" className="mt-6">
            Back to Home
          </Button>
        </Card>
      </section>
    </MarketingLayout>
  );
}

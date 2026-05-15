import { useEffect, useState } from 'react';
import { CalendarDays, CreditCard, ExternalLink, ShieldCheck } from 'lucide-react';
import { DashboardHeader } from '../components/DashboardLayout';
import { SEO } from '../components/SEO';
import { Badge, Button, Card, Skeleton } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchBillingStatus, openBillingPortal } from '../lib/stripe';
import { formatDate } from '../lib/utils';

export default function BillingPage() {
  const { profile } = useAuth();
  const toast = useToast();
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await fetchBillingStatus();
        if (mounted) setBilling(data);
      } catch {
        if (mounted) setBilling(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  async function handlePortal() {
    setPortalLoading(true);
    try {
      await openBillingPortal();
    } catch (error) {
      toast.error(error.message);
      setPortalLoading(false);
    }
  }

  return (
    <>
      <SEO title="Billing" description="Manage your 1PhishGuard AI subscription and Stripe billing portal." />
      <DashboardHeader
        eyebrow="Subscription"
        title="Billing"
        description="Review current plan, next billing date, payment method, and subscription changes."
      />
      {loading ? (
        <div className="grid gap-5 md:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            <Card>
              <ShieldCheck className="h-7 w-7 text-cyan" />
              <p className="mt-5 font-mono text-xs font-bold uppercase text-slate-500">Current plan</p>
              <p className="mt-2 text-3xl font-black capitalize text-white">{billing?.plan || profile?.plan || 'free'}</p>
              {profile?.payment_failed && <Badge className="mt-4 border-suspicious/40 bg-suspicious/10 text-amber-200">Payment issue</Badge>}
            </Card>
            <Card>
              <CalendarDays className="h-7 w-7 text-cyan" />
              <p className="mt-5 font-mono text-xs font-bold uppercase text-slate-500">Next billing date</p>
              <p className="mt-2 text-3xl font-black text-white">{billing?.nextBillingDate ? formatDate(billing.nextBillingDate) : 'N/A'}</p>
            </Card>
            <Card>
              <CreditCard className="h-7 w-7 text-cyan" />
              <p className="mt-5 font-mono text-xs font-bold uppercase text-slate-500">Payment method</p>
              <p className="mt-2 text-3xl font-black text-white">{billing?.cardLast4 ? `•••• ${billing.cardLast4}` : 'N/A'}</p>
            </Card>
          </div>
          <Card className="mt-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Stripe Customer Portal</h2>
                <p className="mt-2 text-sm text-slate-400">Cancel plan, update card, download invoices, or change subscriptions.</p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button onClick={handlePortal} loading={portalLoading}>
                  Manage Subscription <ExternalLink className="h-4 w-4" />
                </Button>
                <Button to="/pricing" variant="secondary">
                  Upgrade/Downgrade
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </>
  );
}

import { MarketingLayout } from '../../components/MarketingLayout';
import { SEO } from '../../components/SEO';
import { Card } from '../../components/ui';

const sections = [
  {
    title: 'Acceptance of Terms',
    body: 'By creating an account, accessing the dashboard, scanning email content, or purchasing a subscription, you agree to these Terms of Service for 1PhishGuard AI.',
  },
  {
    title: 'Service Description',
    body: '1PhishGuard AI provides AI-assisted phishing email analysis, risk scoring, saved scan history, reports, team workspace features, and subscription billing. The service is a decision-support tool and does not replace professional security judgment.',
  },
  {
    title: 'Accounts and Security',
    body: 'You are responsible for maintaining the confidentiality of your account, configuring authentication providers, protecting environment variables, and ensuring authorized use by your organization.',
  },
  {
    title: 'Acceptable Use',
    body: 'You may not use the service to conduct illegal activity, upload malicious content except for defensive analysis, reverse engineer platform controls, overload the service, or violate third-party rights.',
  },
  {
    title: 'Subscriptions and Billing',
    body: 'Paid plans are billed through Stripe. Subscription upgrades, downgrades, card changes, cancellations, and invoices are handled through Stripe Checkout and Customer Portal. Fees are non-refundable except where required by law or explicitly stated in a separate agreement.',
  },
  {
    title: 'AI Output',
    body: 'AI-generated reports may be incomplete, inaccurate, or affected by the quality of submitted content. You should validate critical security decisions using additional context and established incident response procedures.',
  },
  {
    title: 'Customer Data',
    body: 'You retain ownership of submitted email content and scan history. You grant the service permission to process that data to provide analysis, reporting, support, security, and billing functionality.',
  },
  {
    title: 'Availability',
    body: 'The service may be interrupted for maintenance, provider outages, abuse prevention, or operational issues. We may modify or discontinue features as the product evolves.',
  },
  {
    title: 'Limitation of Liability',
    body: 'To the maximum extent permitted by law, 1PhishGuard AI is not liable for indirect, incidental, special, consequential, or punitive damages, including loss from phishing incidents, business interruption, or data loss.',
  },
  {
    title: 'Contact',
    body: 'For legal notices, contact legal@1phishguard.io. These terms are starter product text and should be reviewed by counsel before production launch.',
  },
];

export default function TermsPage() {
  return (
    <MarketingLayout>
      <SEO title="Terms of Service" description="Terms of Service for 1PhishGuard AI." />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-white md:text-6xl">Terms of Service</h1>
        <p className="mt-4 text-slate-400">Last updated: May 15, 2026</p>
        <Card className="mt-8">
          <div className="grid gap-8">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-2xl font-black text-white">{section.title}</h2>
                <p className="mt-3 leading-7 text-slate-300">{section.body}</p>
              </section>
            ))}
          </div>
        </Card>
      </section>
    </MarketingLayout>
  );
}

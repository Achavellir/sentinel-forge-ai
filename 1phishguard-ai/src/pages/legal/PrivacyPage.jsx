import { MarketingLayout } from '../../components/MarketingLayout';
import { SEO } from '../../components/SEO';
import { Card } from '../../components/ui';

const sections = [
  {
    title: 'Information We Collect',
    body: '1PhishGuard AI collects account information such as name, email address, authentication identifiers, subscription status, billing customer identifiers, and profile preferences. When you scan an email, we store the email preview, verdict, risk score, generated report JSON, and timestamp. We do not require direct inbox access for the standard web application.',
  },
  {
    title: 'How We Use Information',
    body: 'We use information to authenticate users, enforce scan limits, generate AI phishing analysis, save scan history, provide team and reporting features, process subscriptions, detect abuse, improve reliability, and communicate account or billing updates.',
  },
  {
    title: 'AI Processing',
    body: 'Email content submitted for analysis is sent to the configured Anthropic Claude API endpoint by the serverless analysis function. You should avoid submitting unnecessary personal data, secrets, or regulated data unless your organization has approved that workflow.',
  },
  {
    title: 'Payments',
    body: 'Payments are processed by Stripe Checkout and Stripe Customer Portal. 1PhishGuard AI stores Stripe customer and subscription identifiers, but does not store full payment card numbers.',
  },
  {
    title: 'Security',
    body: 'The application is designed around Supabase Auth, row-level security policies, server-side webhook validation, and protected dashboard routes. You are responsible for configuring Supabase, Stripe, Vercel, OAuth providers, storage buckets, and environment variables securely.',
  },
  {
    title: 'Data Sharing',
    body: 'We share information with infrastructure providers used to operate the service, including Supabase, Stripe, Vercel, and Anthropic. We do not sell personal information.',
  },
  {
    title: 'Retention',
    body: 'Scan history remains available until deleted by the user or account administrator, or until the account is deleted. Billing records may be retained by Stripe according to Stripe policies and applicable law.',
  },
  {
    title: 'Your Rights',
    body: 'Depending on your location, you may request access, correction, deletion, or export of personal information. Account deletion is available from Settings when the service role environment variable is configured.',
  },
  {
    title: 'Contact',
    body: 'For privacy requests, contact privacy@1phishguard.io. This policy is intended as starter product text and should be reviewed by counsel before production launch.',
  },
];

export default function PrivacyPage() {
  return (
    <MarketingLayout>
      <SEO title="Privacy Policy" description="Privacy Policy for 1PhishGuard AI." />
      <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-black text-white md:text-6xl">Privacy Policy</h1>
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

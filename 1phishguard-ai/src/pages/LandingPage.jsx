import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  MailWarning,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { MarketingLayout } from '../components/MarketingLayout';
import { SEO } from '../components/SEO';
import { Badge, Button, Card } from '../components/ui';
import { faqs, features, heroStats, planCatalog, steps, testimonials } from '../data/marketing';

const heroImage =
  'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1400&q=80';

function MiniDashboard() {
  return (
    <div className="relative overflow-hidden rounded-lg border border-white/10 bg-slate-950/86 shadow-glow">
      <img
        src={heroImage}
        alt="Cybersecurity operations center screens"
        className="hero-image-mask absolute inset-0 h-full w-full object-cover opacity-24"
      />
      <div className="relative p-4 sm:p-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-bold uppercase text-cyan">Live threat report</p>
            <h3 className="mt-1 text-xl font-black text-white">Invoice Update Required</h3>
          </div>
          <Badge className="border-phishing/40 bg-phishing/15 text-red-200">Phishing</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ['Risk', '91/100'],
            ['Signals', '6 found'],
            ['Action', 'Block sender'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-slate-800 bg-slate-950/70 p-3">
              <p className="font-mono text-[11px] font-bold uppercase text-slate-500">{label}</p>
              <p className="mt-1 text-lg font-black text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="relative mt-5 overflow-hidden rounded-lg border border-slate-800 bg-slate-950/80 p-4">
          <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-cyan/20 to-transparent animate-scan-line" />
          {[
            ['Spoofed sender display name', 'High'],
            ['Payment urgency language', 'High'],
            ['Lookalike URL detected', 'Critical'],
            ['Attachment mismatch', 'Medium'],
          ].map(([label, severity]) => (
            <div key={label} className="relative flex items-center justify-between border-b border-slate-800 py-2 last:border-0">
              <span className="text-sm text-slate-300">{label}</span>
              <span className="font-mono text-xs text-cyan">{severity}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PricingPreview() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      {planCatalog.map((plan) => (
        <Card key={plan.id} className={plan.popular ? 'border-primary/50 shadow-glow' : ''}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-slate-400">{plan.description}</p>
            </div>
            {plan.popular && <Badge className="border-cyan/40 bg-cyan/10 text-cyan">Popular</Badge>}
          </div>
          <p className="mt-5 text-4xl font-black text-white">
            ${plan.price}
            <span className="text-base font-medium text-slate-500">/mo</span>
          </p>
          <ul className="mt-5 grid gap-3 text-sm text-slate-300">
            {plan.features.map((feature) => (
              <li key={feature} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
                {feature}
              </li>
            ))}
          </ul>
          <Button to={plan.id === 'free' ? '/signup' : '/pricing'} variant={plan.popular ? 'primary' : 'secondary'} className="mt-6 w-full">
            {plan.cta}
          </Button>
        </Card>
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <MarketingLayout>
      <SEO
        title="AI Phishing Email Detection"
        description="1PhishGuard AI detects phishing emails with Claude-powered analysis, threat reports, team dashboards, and Stripe-backed subscriptions."
      />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(37,99,235,0.22),transparent_34%),radial-gradient(circle_at_80%_10%,rgba(6,182,212,0.16),transparent_32%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 pb-14 pt-16 sm:px-6 lg:grid-cols-[1fr_0.92fr] lg:px-8 lg:pb-20 lg:pt-24">
          <div className="animate-fade-up">
            <Badge className="border-cyan/40 bg-cyan/10 text-cyan">
              <Sparkles className="h-3.5 w-3.5" />
              Cybersecurity SaaS
            </Badge>
            <h1 className="mt-6 max-w-4xl text-5xl font-black leading-[1.02] tracking-normal text-white md:text-7xl">
              Is that email trying to scam you?
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              1PhishGuard AI gives teams instant phishing verdicts, risk scores, threat signals, and recommended actions before a bad link becomes an incident.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button to="/signup" size="lg">
                Start for Free <ArrowRight className="h-4 w-4" />
              </Button>
              <Button to="/pricing" size="lg" variant="secondary">
                See Pricing
              </Button>
            </div>
            <div className="mt-8 grid max-w-2xl gap-3 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div key={stat.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-2xl font-black text-white">{stat.value}</p>
                  <p className="mt-1 font-mono text-[11px] font-bold uppercase text-slate-500">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="animate-fade-up lg:pt-10">
            <MiniDashboard />
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-bold uppercase text-cyan">Platform</p>
          <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Built for fast phishing triage</h2>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title}>
                <Icon className="h-8 w-8 text-cyan" aria-hidden="true" />
                <h3 className="mt-5 text-xl font-bold text-white">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">{feature.description}</p>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-y border-white/10 bg-slate-950/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1fr] lg:items-start">
            <div>
              <p className="font-mono text-xs font-bold uppercase text-cyan">How it works</p>
              <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">From paste to proof in seconds</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {steps.map((step, index) => (
                <Card key={step.title}>
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/20 font-mono font-bold text-cyan">
                    {index + 1}
                  </span>
                  <h3 className="mt-5 text-lg font-bold text-white">{step.title}</h3>
                  <p className="mt-2 text-sm text-slate-400">{step.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="font-mono text-xs font-bold uppercase text-cyan">Pricing</p>
            <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Start lean, scale with your team</h2>
          </div>
          <Link to="/pricing" className="inline-flex items-center gap-2 font-mono text-sm font-bold text-cyan">
            Full pricing <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <PricingPreview />
      </section>

      <section className="border-y border-white/10 bg-slate-950/50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name}>
                <p className="text-slate-300">"{testimonial.quote}"</p>
                <div className="mt-6 border-t border-white/10 pt-4">
                  <p className="font-bold text-white">{testimonial.name}</p>
                  <p className="text-sm text-slate-500">{testimonial.title}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="font-mono text-xs font-bold uppercase text-cyan">FAQ</p>
          <h2 className="mt-3 text-3xl font-black text-white md:text-5xl">Security teams ask good questions</h2>
        </div>
        <div className="mt-8 grid gap-3">
          {faqs.map((faq) => (
            <details key={faq.question} className="glass rounded-lg p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-white">
                {faq.question}
                <ChevronDown className="h-4 w-4 text-cyan" aria-hidden="true" />
              </summary>
              <p className="mt-3 text-sm leading-6 text-slate-400">{faq.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="glass grid gap-6 rounded-lg p-6 md:grid-cols-[1fr_auto] md:items-center">
          <div className="flex gap-4">
            <div className="hidden h-14 w-14 place-items-center rounded-lg bg-cyan/10 text-cyan sm:grid">
              <MailWarning className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">Give every suspicious email a second opinion.</h2>
              <p className="mt-2 text-slate-400">Start with 5 free monthly scans and upgrade when your team needs more coverage.</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button to="/signup">Start for Free</Button>
            <Button to="/dashboard/scan" variant="secondary">
              Open Scanner
            </Button>
          </div>
        </div>
      </section>
    </MarketingLayout>
  );
}

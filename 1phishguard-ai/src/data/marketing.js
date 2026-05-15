import {
  BarChart3,
  Bot,
  FileSearch,
  GraduationCap,
  Link2,
  ScanSearch,
  ShieldCheck,
  Users,
  Zap,
} from 'lucide-react';

export const heroStats = [
  { label: 'Emails scanned', value: '3.2M+' },
  { label: 'Detection accuracy', value: '99.4%' },
  { label: 'Avg response time', value: '2.8s' },
];

export const features = [
  {
    title: 'AI Analysis',
    description: 'Claude-powered reasoning flags spoofing, urgency, malicious links, and social engineering patterns.',
    icon: Bot,
  },
  {
    title: 'Real-time Scanning',
    description: 'Paste suspicious emails and get a structured verdict before anyone clicks.',
    icon: ScanSearch,
  },
  {
    title: 'Threat Reports',
    description: 'Readable summaries and evidence trails help security teams document every decision.',
    icon: FileSearch,
  },
  {
    title: 'Team Dashboard',
    description: 'Track risk volume, seats, scan trends, and recurring attack types across the organization.',
    icon: Users,
  },
  {
    title: 'URL Scanner',
    description: 'Extract and inspect links for mismatch, lookalike domains, risky redirects, and login traps.',
    icon: Link2,
  },
  {
    title: 'Training Mode',
    description: 'Turn examples into teachable moments with recommended employee guidance.',
    icon: GraduationCap,
  },
];

export const steps = [
  {
    title: 'Paste Email',
    description: 'Drop in raw content, headers, or a message excerpt.',
  },
  {
    title: 'AI Analyzes',
    description: 'PGA evaluates sender identity, URLs, tone, payloads, and intent.',
  },
  {
    title: 'Get Report',
    description: 'Receive a verdict, risk score, threat signals, and next actions.',
  },
];

export const planCatalog = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'For individual spot checks.',
    cta: 'Start for Free',
    features: ['5 scans/month', 'Basic threat score', '1 user'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 9,
    description: 'For professionals and security operators.',
    cta: 'Upgrade to Pro',
    popular: true,
    features: ['Unlimited scans', 'Detailed AI reports', 'URL scanning', 'Priority support'],
  },
  {
    id: 'business',
    name: 'Business',
    price: 29,
    description: 'For teams standardizing phishing triage.',
    cta: 'Get Business',
    features: [
      'Everything in Pro',
      '10 users',
      'Team dashboard',
      'CSV exports',
      'Training mode',
      'API access',
    ],
  },
];

export const testimonials = [
  {
    quote: 'PGA gives our help desk a clear, defensible answer in seconds. It has lowered noise without hiding risk.',
    name: 'Maya R.',
    title: 'Director of Security Operations',
  },
  {
    quote: 'The reports are readable enough for executives and detailed enough for analysts. That combination is rare.',
    name: 'Jon Bell',
    title: 'Senior Incident Response Lead',
  },
  {
    quote: 'We use the training output after every campaign. Employees get context, not just a red or green light.',
    name: 'Priya S.',
    title: 'Security Awareness Manager',
  },
];

export const faqs = [
  {
    question: 'Does 1PhishGuard AI read inboxes automatically?',
    answer: 'No. Users paste email content into the scanner. API integrations can be added for controlled workflows.',
  },
  {
    question: 'Can PGA detect business email compromise?',
    answer: 'Yes. The scanner checks sender identity, urgency, payment language, impersonation, and unusual requests.',
  },
  {
    question: 'Where are scan results stored?',
    answer: 'Results are stored in your Supabase database under row-level security for the authenticated user.',
  },
  {
    question: 'Can I export reports?',
    answer: 'Business users can export CSV summaries from the Reports page.',
  },
  {
    question: 'Is the free plan limited?',
    answer: 'Free users get 5 scans per month. Pro and Business plans include unlimited scans.',
  },
];

export const billingFaqs = [
  {
    question: 'Can I cancel anytime?',
    answer: 'Yes. The Billing page opens Stripe Customer Portal for cancellation, card updates, and invoices.',
  },
  {
    question: 'How does annual billing work?',
    answer: 'Annual plans show a 20% discount and use your annual Stripe Price IDs.',
  },
  {
    question: 'What happens after a failed payment?',
    answer: 'The webhook marks the profile so you can surface billing warnings while Stripe retries payment.',
  },
];

export const threatStats = [
  { label: 'Total scanned', key: 'total', icon: BarChart3 },
  { label: 'Phishing caught', key: 'phishing', icon: ShieldCheck },
  { label: 'Safe emails', key: 'safe', icon: Zap },
  { label: 'Suspicious', key: 'suspicious', icon: FileSearch },
];

export const scanFocusOptions = ['Full Analysis', 'Links & URLs', 'Sender Identity', 'Urgency Tactics'];

export const loadingSteps = [
  'Parsing headers...',
  'Analyzing sender...',
  'Scanning signals...',
  'Running AI model...',
  'Generating report...',
];

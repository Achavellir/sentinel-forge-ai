import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCopy,
  FileCheck2,
  Link2,
  Loader2,
  Save,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { DashboardHeader } from '../../components/DashboardLayout';
import { SEO } from '../../components/SEO';
import { Badge, Button, Card, Field, Select, Textarea } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { loadingSteps, scanFocusOptions } from '../../data/marketing';
import { analyzeEmail } from '../../lib/ai';
import { buildEmailPreview, clamp, getVerdictMeta } from '../../lib/utils';

function SignalIcon({ name }) {
  const lower = String(name).toLowerCase();
  if (lower.includes('url') || lower.includes('link')) return <Link2 className="h-5 w-5" />;
  if (lower.includes('sender') || lower.includes('spoof')) return <ShieldAlert className="h-5 w-5" />;
  if (lower.includes('safe')) return <ShieldCheck className="h-5 w-5" />;
  return <AlertTriangle className="h-5 w-5" />;
}

function severityClass(severity = 'medium') {
  const value = String(severity).toLowerCase();
  if (value.includes('critical') || value.includes('high')) return 'border-phishing/30 bg-phishing/10 text-red-200';
  if (value.includes('medium')) return 'border-suspicious/30 bg-suspicious/10 text-amber-200';
  return 'border-safe/30 bg-safe/10 text-emerald-200';
}

function ResultPanel({ result, emailPreview }) {
  const toast = useToast();
  const meta = getVerdictMeta(result.verdict);
  const risk = clamp(result.riskScore);

  const reportText = useMemo(
    () =>
      [
        `Verdict: ${result.verdictTitle || meta.label}`,
        `Risk Score: ${risk}/100`,
        `Attack Type: ${result.attackType || 'N/A'}`,
        `Summary: ${result.summary}`,
        '',
        'Threat Signals:',
        ...(result.signals || []).map((signal) => `- ${signal.name} (${signal.severity}): ${signal.description}`),
        '',
        'Recommended Actions:',
        ...(result.recommendations || []).map((item) => `- ${item}`),
      ].join('\n'),
    [result, meta.label, risk],
  );

  async function copyReport() {
    await navigator.clipboard.writeText(reportText);
    toast.success('Report copied.');
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 border-b border-white/10 pb-5 md:flex-row md:items-center md:justify-between">
        <div>
          <Badge className={meta.badge}>{result.verdict || meta.label}</Badge>
          <h2 className="mt-3 text-3xl font-black text-white">{result.verdictTitle || meta.label}</h2>
          <p className="mt-2 max-w-2xl text-slate-400">{result.summary}</p>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-5 text-center">
          <p className="font-mono text-xs font-bold uppercase text-slate-500">Risk score</p>
          <p className={`mt-2 text-5xl font-black ${meta.text}`}>{risk}</p>
        </div>
      </div>
      <div className="mt-5">
        <div className="mb-2 flex justify-between font-mono text-xs font-bold uppercase text-slate-500">
          <span>Risk intensity</span>
          <span>{risk}/100</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-slate-800">
          <div className={`h-full rounded-full ${meta.bar} transition-all duration-700`} style={{ width: `${risk}%` }} />
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {(result.signals || []).slice(0, 6).map((signal) => (
          <div key={`${signal.name}-${signal.description}`} className="rounded-lg border border-slate-800 bg-slate-950/45 p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-cyan/10 text-cyan">
                <SignalIcon name={signal.icon || signal.name} />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-white">{signal.name}</h3>
                  <Badge className={severityClass(signal.severity)}>{signal.severity || 'medium'}</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-400">{signal.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-lg border border-slate-800 bg-slate-950/45 p-4">
          <h3 className="font-mono text-xs font-bold uppercase text-cyan">Recommended actions</h3>
          <ul className="mt-3 grid gap-2 text-sm text-slate-300">
            {(result.recommendations || []).map((item) => (
              <li key={item} className="flex gap-2">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-safe" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-lg border border-slate-800 bg-slate-950/45 p-4">
          <h3 className="font-mono text-xs font-bold uppercase text-cyan">Saved preview</h3>
          <p className="mt-3 line-clamp-4 text-sm text-slate-400">{emailPreview}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button variant="secondary" onClick={copyReport}>
              <ClipboardCopy className="h-4 w-4" /> Copy Report
            </Button>
            <Button variant="secondary" disabled>
              <Save className="h-4 w-4" /> Saved to History
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ScanPage() {
  const { profile, refreshProfile } = useAuth();
  const toast = useToast();
  const [emailText, setEmailText] = useState('');
  const [focus, setFocus] = useState(scanFocusOptions[0]);
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [result, setResult] = useState(null);
  const [lastPreview, setLastPreview] = useState('');

  const quotaBlocked = profile?.plan === 'free' && profile.scans_used >= profile.scans_limit;
  const quotaWarning =
    profile?.plan === 'free' && profile.scans_limit > 0 && profile.scans_used / profile.scans_limit >= 0.8;

  async function handleScan() {
    if (emailText.trim().length < 20) {
      setError('Paste at least 20 characters of email content.');
      return;
    }
    if (quotaBlocked) {
      toast.error('Free scan limit reached. Upgrade to continue scanning.');
      return;
    }
    setError('');
    setResult(null);
    setScanning(true);
    setStepIndex(0);
    const timer = window.setInterval(() => {
      setStepIndex((value) => Math.min(value + 1, loadingSteps.length - 1));
    }, 700);
    try {
      const preview = buildEmailPreview(emailText);
      const data = await analyzeEmail({ emailText, focus });
      setResult(data.result);
      setLastPreview(preview);
      await refreshProfile();
      toast.success('AI report generated and saved.');
    } catch (scanError) {
      toast.error(scanError.message);
    } finally {
      window.clearInterval(timer);
      setScanning(false);
    }
  }

  return (
    <>
      <SEO title="Scan Email" description="Paste an email into 1PhishGuard AI for Claude-powered phishing analysis." />
      <DashboardHeader
        eyebrow="AI scanner"
        title="Scan Email"
        description="Analyze email body, sender clues, urgency, URLs, and social engineering signals."
      />
      <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
        <Card>
          <Field label="Email content" error={error}>
            <Textarea
              value={emailText}
              onChange={(event) => setEmailText(event.target.value)}
              rows={16}
              placeholder="Paste the suspicious email here..."
            />
          </Field>
          <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto]">
            <Field label="Scan focus">
              <Select value={focus} onChange={(event) => setFocus(event.target.value)}>
                {scanFocusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </Select>
            </Field>
            <div className="flex items-end">
              <Button className="w-full md:w-auto" onClick={handleScan} loading={scanning} disabled={quotaBlocked}>
                <Sparkles className="h-4 w-4" /> Scan Now
              </Button>
            </div>
          </div>
          {quotaWarning && (
            <div className="mt-4 rounded-lg border border-suspicious/30 bg-suspicious/10 p-3 text-sm text-amber-100">
              {quotaBlocked
                ? 'Monthly scan limit reached. Upgrade for unlimited scans.'
                : 'You have used 80% or more of your free monthly scans.'}
            </div>
          )}
        </Card>

        <div>
          {scanning ? (
            <Card className="grid min-h-[420px] place-items-center text-center">
              <div>
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-cyan" />
                <p className="mt-5 font-mono text-sm font-bold uppercase text-cyan">{loadingSteps[stepIndex]}</p>
                <p className="mt-3 text-slate-400">Claude is evaluating phishing, scam, and social engineering signals.</p>
              </div>
            </Card>
          ) : result ? (
            <ResultPanel result={result} emailPreview={lastPreview} />
          ) : (
            <Card className="grid min-h-[420px] place-items-center text-center">
              <div>
                <FileCheck2 className="mx-auto h-12 w-12 text-cyan" />
                <h2 className="mt-4 text-2xl font-black text-white">Results panel</h2>
                <p className="mt-2 max-w-md text-slate-400">Your verdict, risk score, threat signals, and recommendations will appear here.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}

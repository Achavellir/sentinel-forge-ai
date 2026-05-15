import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, MailWarning, ScanSearch } from 'lucide-react';
import { DashboardHeader } from '../../components/DashboardLayout';
import { SEO } from '../../components/SEO';
import { Badge, Button, Card, Skeleton } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { threatStats } from '../../data/marketing';
import { fetchScans } from '../../lib/supabase';
import { formatDate, getVerdictMeta } from '../../lib/utils';

function summarize(scans) {
  return scans.reduce(
    (acc, scan) => {
      acc.total += 1;
      const verdict = String(scan.verdict || '').toLowerCase();
      if (verdict === 'phishing') acc.phishing += 1;
      if (verdict === 'safe') acc.safe += 1;
      if (verdict === 'suspicious') acc.suspicious += 1;
      return acc;
    },
    { total: 0, phishing: 0, safe: 0, suspicious: 0 },
  );
}

export default function DashboardHome() {
  const { user, profile } = useAuth();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const data = await fetchScans(user.id, 8);
        if (mounted) setScans(data);
      } catch {
        if (mounted) setScans([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user]);

  const stats = useMemo(() => summarize(scans), [scans]);
  const used = profile?.scans_used || 0;
  const limit = profile?.plan === 'free' ? profile?.scans_limit || 5 : 'Unlimited';
  const quotaPercent = profile?.plan === 'free' ? Math.min(100, Math.round((used / (profile?.scans_limit || 5)) * 100)) : 8;

  return (
    <>
      <SEO title="Dashboard" description="1PhishGuard AI dashboard with scan quota, recent scans, and threat summary." />
      <DashboardHeader
        eyebrow="Command center"
        title={`Welcome${profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}`}
        description="Monitor phishing scan volume, inspect recent verdicts, and launch a new AI analysis."
        action={
          <Button to="/dashboard/scan">
            <ScanSearch className="h-4 w-4" /> Quick Scan
          </Button>
        }
      />

      <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-bold uppercase text-cyan">Scan quota</p>
              <p className="mt-3 text-4xl font-black text-white">
                {used}
                <span className="text-lg text-slate-500"> of {limit}</span>
              </p>
            </div>
            <Badge className="border-primary/40 bg-primary/10 text-blue-200">{profile?.plan || 'free'}</Badge>
          </div>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800">
            <div className="h-full rounded-full bg-cyan transition-all" style={{ width: `${quotaPercent}%` }} />
          </div>
          {profile?.plan === 'free' && quotaPercent >= 80 && (
            <div className="mt-4 rounded-lg border border-suspicious/30 bg-suspicious/10 p-3 text-sm text-amber-100">
              You are nearing your monthly scan limit. Upgrade for unlimited scans.
            </div>
          )}
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {threatStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.key}>
                <Icon className="h-6 w-6 text-cyan" />
                <p className="mt-5 text-3xl font-black text-white">{stats[stat.key]}</p>
                <p className="font-mono text-xs font-bold uppercase text-slate-500">{stat.label}</p>
              </Card>
            );
          })}
        </div>
      </div>

      <Card className="mt-5">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white">Recent scans</h2>
            <p className="text-sm text-slate-500">Latest AI verdicts saved to your history.</p>
          </div>
          <Button to="/dashboard/history" variant="secondary" size="sm">
            View All <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        {loading ? (
          <div className="grid gap-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : scans.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-700 p-8 text-center">
            <MailWarning className="mx-auto h-10 w-10 text-cyan" />
            <p className="mt-3 font-bold text-white">No scans yet</p>
            <p className="text-sm text-slate-500">Your first report will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="font-mono text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3">Date</th>
                  <th className="py-3">Subject / preview</th>
                  <th className="py-3">Verdict</th>
                  <th className="py-3">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {scans.map((scan) => {
                  const meta = getVerdictMeta(scan.verdict);
                  return (
                    <tr key={scan.id}>
                      <td className="py-3 text-slate-400">{formatDate(scan.created_at)}</td>
                      <td className="max-w-md truncate py-3 text-slate-200">{scan.email_preview}</td>
                      <td className="py-3">
                        <Badge className={meta.badge}>{meta.label}</Badge>
                      </td>
                      <td className="py-3 font-mono text-slate-200">{scan.risk_score}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

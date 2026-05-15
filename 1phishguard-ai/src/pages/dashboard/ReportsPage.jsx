import { useEffect, useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download } from 'lucide-react';
import { DashboardHeader } from '../../components/DashboardLayout';
import { SEO } from '../../components/SEO';
import { Button, Card, Skeleton } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { fetchScans } from '../../lib/supabase';
import { downloadCsv, formatDate } from '../../lib/utils';

function getChartData(scans) {
  const days = new Map();
  for (let index = 29; index >= 0; index -= 1) {
    const date = new Date();
    date.setDate(date.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    days.set(key, { date: key.slice(5), safe: 0, suspicious: 0, phishing: 0 });
  }

  scans.forEach((scan) => {
    const key = new Date(scan.created_at).toISOString().slice(0, 10);
    const row = days.get(key);
    if (!row) return;
    const verdict = String(scan.verdict || '').toLowerCase();
    if (verdict in row) row[verdict] += 1;
  });

  return Array.from(days.values());
}

export default function ReportsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const data = await fetchScans(user.id, 500);
        if (mounted) setScans(data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [user, toast]);

  const summary = useMemo(() => {
    const total = scans.length;
    const phishing = scans.filter((scan) => String(scan.verdict).toLowerCase() === 'phishing').length;
    const avgRisk = total ? Math.round(scans.reduce((sum, scan) => sum + Number(scan.risk_score || 0), 0) / total) : 0;
    return { total, phishing, avgRisk };
  }, [scans]);

  const chartData = useMemo(() => getChartData(scans), [scans]);

  function handleExport() {
    const rows = [
      ['date', 'preview', 'verdict', 'risk_score'],
      ...scans.map((scan) => [formatDate(scan.created_at), scan.email_preview, scan.verdict, scan.risk_score]),
    ];
    downloadCsv('1phishguard-scans.csv', rows);
  }

  return (
    <>
      <SEO title="Reports" description="Analyze phishing scan trends and export CSV reports from 1PhishGuard AI." />
      <DashboardHeader
        eyebrow="Analytics"
        title="Reports"
        description="Track verdict trends and scan risk over the last 30 days."
        action={
          <Button variant="secondary" onClick={handleExport}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ['Total scans', summary.total],
          ['Phishing caught', summary.phishing],
          ['Avg risk score', summary.avgRisk],
        ].map(([label, value]) => (
          <Card key={label}>
            <p className="font-mono text-xs font-bold uppercase text-slate-500">{label}</p>
            <p className="mt-4 text-4xl font-black text-white">{value}</p>
          </Card>
        ))}
      </div>

      <Card className="mt-5">
        <h2 className="mb-5 text-xl font-black text-white">Scans by verdict</h2>
        {loading ? (
          <Skeleton className="h-[360px]" />
        ) : (
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis allowDecimals={false} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ background: '#0f172a', border: '1px solid rgba(148,163,184,.2)', borderRadius: 8 }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="safe" stackId="a" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="suspicious" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="phishing" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </>
  );
}

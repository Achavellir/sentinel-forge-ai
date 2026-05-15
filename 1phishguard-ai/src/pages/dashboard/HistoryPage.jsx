import { useEffect, useMemo, useState } from 'react';
import { Eye, Filter, Search, Trash2 } from 'lucide-react';
import { DashboardHeader } from '../../components/DashboardLayout';
import { SEO } from '../../components/SEO';
import { Badge, Button, Card, EmptyState, Field, Input, Select, Skeleton } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { deleteScan, fetchScans } from '../../lib/supabase';
import { formatDate, getVerdictMeta } from '../../lib/utils';

export default function HistoryPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ verdict: 'all', query: '', from: '', to: '' });
  const [selectedScan, setSelectedScan] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const data = await fetchScans(user.id, 100);
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

  const filtered = useMemo(() => {
    return scans.filter((scan) => {
      const verdictOk =
        filters.verdict === 'all' || String(scan.verdict).toLowerCase() === filters.verdict;
      const queryOk =
        !filters.query ||
        String(scan.email_preview || '').toLowerCase().includes(filters.query.toLowerCase());
      const date = new Date(scan.created_at);
      const fromOk = !filters.from || date >= new Date(filters.from);
      const toOk = !filters.to || date <= new Date(`${filters.to}T23:59:59`);
      return verdictOk && queryOk && fromOk && toOk;
    });
  }, [scans, filters]);

  async function handleDelete(scanId) {
    await deleteScan(scanId);
    setScans((current) => current.filter((scan) => scan.id !== scanId));
    toast.success('Scan deleted.');
  }

  return (
    <>
      <SEO title="History" description="View and filter saved 1PhishGuard AI phishing scan history." />
      <DashboardHeader
        eyebrow="Evidence log"
        title="History"
        description="Search prior scans by verdict, date range, and email preview."
      />
      <Card>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="Verdict">
            <Select
              value={filters.verdict}
              onChange={(event) => setFilters((value) => ({ ...value, verdict: event.target.value }))}
            >
              <option value="all">All verdicts</option>
              <option value="safe">Safe</option>
              <option value="suspicious">Suspicious</option>
              <option value="phishing">Phishing</option>
            </Select>
          </Field>
          <Field label="From">
            <Input
              type="date"
              value={filters.from}
              onChange={(event) => setFilters((value) => ({ ...value, from: event.target.value }))}
            />
          </Field>
          <Field label="To">
            <Input
              type="date"
              value={filters.to}
              onChange={(event) => setFilters((value) => ({ ...value, to: event.target.value }))}
            />
          </Field>
          <Field label="Search">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-600" />
              <Input
                className="pl-9"
                value={filters.query}
                onChange={(event) => setFilters((value) => ({ ...value, query: event.target.value }))}
                placeholder="Invoice, sender..."
              />
            </div>
          </Field>
        </div>
      </Card>

      <Card className="mt-5">
        {loading ? (
          <div className="grid gap-3">
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
            <Skeleton className="h-14" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Filter}
            title="No scans match"
            description="Adjust the filters or run a new scan."
            action={<Button to="/dashboard/scan">Scan Email</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[780px] text-left text-sm">
              <thead className="font-mono text-xs uppercase text-slate-500">
                <tr>
                  <th className="py-3">Date</th>
                  <th className="py-3">Subject / preview</th>
                  <th className="py-3">Verdict</th>
                  <th className="py-3">Risk score</th>
                  <th className="py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((scan) => {
                  const meta = getVerdictMeta(scan.verdict);
                  return (
                    <tr key={scan.id}>
                      <td className="py-3 text-slate-400">{formatDate(scan.created_at)}</td>
                      <td className="max-w-md truncate py-3 text-slate-200">{scan.email_preview}</td>
                      <td className="py-3">
                        <Badge className={meta.badge}>{meta.label}</Badge>
                      </td>
                      <td className="py-3 font-mono text-slate-200">{scan.risk_score}</td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => setSelectedScan(scan)}>
                            <Eye className="h-4 w-4" /> View
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => handleDelete(scan.id)}>
                            <Trash2 className="h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selectedScan && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4" onClick={() => setSelectedScan(null)}>
          <div className="glass max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg p-6" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">Scan report</h2>
                <p className="text-sm text-slate-500">{formatDate(selectedScan.created_at, { hour: 'numeric', minute: 'numeric' })}</p>
              </div>
              <Badge className={getVerdictMeta(selectedScan.verdict).badge}>{getVerdictMeta(selectedScan.verdict).label}</Badge>
            </div>
            <pre className="mt-5 whitespace-pre-wrap rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
              {JSON.stringify(selectedScan.result_json, null, 2)}
            </pre>
            <Button className="mt-5 w-full" variant="secondary" onClick={() => setSelectedScan(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

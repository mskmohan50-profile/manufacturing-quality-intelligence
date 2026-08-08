import { useCallback, useEffect, useState } from 'react';
import { ScrollText, Activity, User, Clock } from 'lucide-react';
import { fetchAuditLogs } from '@/lib/audit';
import type { AuditLog } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

const actionColors: Record<string, 'success' | 'info' | 'warning' | 'error' | 'default'> = {
  upload: 'success',
  export_csv: 'info',
  export_pdf: 'info',
  login: 'default',
  logout: 'default',
  delete: 'error',
};

const actionIcons: Record<string, typeof Activity> = {
  upload: Activity,
  export_csv: ScrollText,
  export_pdf: ScrollText,
  login: User,
  logout: User,
  delete: Activity,
};

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAuditLogs(100);
      setLogs(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load audit logs.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (loading) return <div className="space-y-4"><SkeletonCard /><SkeletonCard /><SkeletonCard /></div>;
  if (error) return <ErrorState message={error} onRetry={fetchLogs} />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Audit Logs</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Track all user actions and system events across the platform.</p>
      </div>

      {logs.length === 0 ? (
        <Card><CardBody>
          <EmptyState icon={<ScrollText className="w-7 h-7 text-slate-400" />} title="No audit logs yet" description="Actions like uploads, exports, and logins will appear here." />
        </CardBody></Card>
      ) : (
        <Card>
          <CardHeader title="Activity History" subtitle={`${logs.length} recent events`} />
          <CardBody>
            <div className="space-y-2">
              {logs.map((log) => {
                const Icon = actionIcons[log.action] ?? Activity;
                const color = actionColors[log.action] ?? 'default';
                return (
                  <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      color === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40' :
                      color === 'error' ? 'bg-red-50 dark:bg-red-950/40' :
                      color === 'info' ? 'bg-blue-50 dark:bg-blue-950/40' :
                      'bg-slate-100 dark:bg-slate-800'
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        color === 'success' ? 'text-emerald-600 dark:text-emerald-400' :
                        color === 'error' ? 'text-red-600 dark:text-red-400' :
                        color === 'info' ? 'text-blue-600 dark:text-blue-400' :
                        'text-slate-500 dark:text-slate-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={color}>{log.action.replace(/_/g, ' ')}</Badge>
                        <span className="text-xs text-slate-500 dark:text-slate-400">{log.entity_type}</span>
                      </div>
                      {log.details && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {Object.entries(log.details).map(([k, v]) => `${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`).join(' · ')}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

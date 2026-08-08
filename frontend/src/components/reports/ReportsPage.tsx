import { useCallback, useEffect, useState } from 'react';
import { Download, FileText, FileSpreadsheet, BarChart3 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { logAudit } from '@/lib/audit';
import { exportToCSV } from '@/lib/fileParser';
import { exportPDFReport } from '@/lib/pdfExport';
import { computeKPIs } from '@/lib/analytics';
import type { ProductionRecord } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

export function ReportsPage() {
  const { toast } = useToast();
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState<'csv' | 'pdf' | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ data: ProductionRecord[] }>('/api/records?limit=5000');
      setRecords(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load data.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const handleExportCSV = async () => {
    if (records.length === 0) return;
    setExporting('csv');
    try {
      const exportData = records.map((r) => ({
        machine_id: r.machine_id,
        operator: r.operator,
        shift: r.shift,
        product: r.product,
        batch: r.batch,
        production_date: r.production_date,
        cycle_time_sec: r.cycle_time_sec,
        status: r.status,
        defect_type: r.defect_type ?? '',
        temperature: r.temperature ?? '',
        pressure: r.pressure ?? '',
        vibration: r.vibration ?? '',
      }));
      exportToCSV(exportData as unknown as Record<string, unknown>[], `production-records-${Date.now()}.csv`);
      await logAudit('export_csv', 'report', null, { count: records.length });
      toast('success', `Exported ${records.length} records to CSV.`);
    } catch {
      toast('error', 'Failed to export CSV.');
    } finally {
      setExporting(null);
    }
  };

  const handleExportPDF = async () => {
    if (records.length === 0) return;
    setExporting('pdf');
    try {
      const kpis = computeKPIs(records);
      exportPDFReport(records, kpis, `production-report-${Date.now()}.pdf`);
      await logAudit('export_pdf', 'report', null, { count: records.length });
      toast('success', 'PDF report generated.');
    } catch {
      toast('error', 'Failed to generate PDF.');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <SkeletonCard />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) return <ErrorState message={error} onRetry={fetchRecords} />;

  const kpis = computeKPIs(records);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Reports & Export</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Generate and download production reports in CSV or PDF format.</p>
      </div>

      {records.length === 0 ? (
        <Card><CardBody>
          <EmptyState icon={<BarChart3 className="w-7 h-7 text-slate-400" />} title="No data to export" description="Upload production data first to generate reports." />
        </CardBody></Card>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <SummaryStat label="Total Records" value={kpis.totalRecords.toLocaleString()} />
            <SummaryStat label="Yield %" value={`${kpis.yieldPercentage.toFixed(1)}%`} />
            <SummaryStat label="Machines" value={String(kpis.machineCount)} />
            <SummaryStat label="Operators" value={String(kpis.operatorCount)} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader title="CSV Report" subtitle="Full data export with all production records" />
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center flex-shrink-0">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                      Export all {records.length.toLocaleString()} production records as a CSV file. Includes all columns: machine_id, operator, shift, product, batch, date, cycle time, status, defect type, and sensor readings.
                    </p>
                    <Button onClick={handleExportCSV} loading={exporting === 'csv'} disabled={exporting !== null}>
                      <Download className="w-4 h-4" />
                      Download CSV
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="PDF Summary Report" subtitle="Formatted report with KPIs and data tables" />
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                      Generate a professional PDF report with KPI summary, shift breakdown, and production data table. Includes branded header and timestamp.
                    </p>
                    <Button onClick={handleExportPDF} loading={exporting === 'pdf'} disabled={exporting !== null}>
                      <Download className="w-4 h-4" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-2">{value}</p>
    </Card>
  );
}

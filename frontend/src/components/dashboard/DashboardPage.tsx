import { useCallback, useEffect, useMemo, useState } from 'react';
import { Database, CheckCircle2, XCircle, Clock, Cpu, Users, Percent, Gauge, FileBarChart, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import type { ProductionRecord, DashboardKPIs } from '@/types';
import {
  computeKPIs, computeTrend, computeMachinePerformance,
  computeShiftDistribution, computeDefectDistribution,
  computeDataQuality, computeFeatureImportance, generateAIInsights,
} from '@/lib/analytics';
import { KPICard } from '@/components/dashboard/KPICard';
import { TrendChart, ProductionLineChart, MachineBarChart, ShiftPieChart, DefectBarChart } from '@/components/dashboard/Charts';
import { DataQualityCard } from '@/components/dashboard/DataQualityCard';
import { AIInsightsCard } from '@/components/dashboard/AIInsightsCard';
import { FeatureImportanceCard } from '@/components/dashboard/FeatureImportanceCard';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

interface DashboardPageProps {
  onNavigate: (page: 'upload') => void;
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { toast } = useToast();
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ data: ProductionRecord[] }>('/api/records?limit=5000');
      setRecords(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load data.';
      setError(msg);
      toast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const kpis: DashboardKPIs = useMemo(() => computeKPIs(records), [records]);
  const trend = useMemo(() => computeTrend(records), [records]);
  const machinePerf = useMemo(() => computeMachinePerformance(records), [records]);
  const shiftDist = useMemo(() => computeShiftDistribution(records), [records]);
  const defectDist = useMemo(() => computeDefectDistribution(records), [records]);
  const dataQuality = useMemo(() => computeDataQuality(records), [records]);
  const featureImportance = useMemo(() => computeFeatureImportance(records), [records]);
  const aiInsights = useMemo(() => generateAIInsights(records), [records]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error} onRetry={fetchRecords} />;
  }

  if (records.length === 0) {
    return (
      <Card>
        <CardBody>
          <EmptyState
            icon={<Database className="w-7 h-7 text-slate-400" />}
            title="No production data yet"
            description="Upload your first CSV or Excel file to start analyzing manufacturing quality metrics."
            action={<Button onClick={() => onNavigate('upload')}><Upload className="w-4 h-4" /> Upload Data</Button>}
          />
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Quality Dashboard</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Real-time overview of production quality and performance metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard label="Total Records" value={kpis.totalRecords.toLocaleString()} icon={<Database className="w-5 h-5" />} accent="blue" />
        <KPICard label="Accepted Parts" value={kpis.acceptedParts.toLocaleString()} icon={<CheckCircle2 className="w-5 h-5" />} accent="emerald" />
        <KPICard label="Rejected Parts" value={kpis.rejectedParts.toLocaleString()} icon={<XCircle className="w-5 h-5" />} accent="red" />
        <KPICard label="Yield %" value={`${kpis.yieldPercentage.toFixed(1)}%`} icon={<Percent className="w-5 h-5" />} accent={kpis.yieldPercentage >= 90 ? 'emerald' : kpis.yieldPercentage >= 80 ? 'amber' : 'red'} />
        <KPICard label="Avg Cycle Time" value={`${kpis.avgCycleTime.toFixed(1)}s`} icon={<Clock className="w-5 h-5" />} accent="violet" />
        <KPICard label="Machines" value={kpis.machineCount} icon={<Cpu className="w-5 h-5" />} accent="slate" />
        <KPICard label="Operators" value={kpis.operatorCount} icon={<Users className="w-5 h-5" />} accent="slate" />
        <KPICard label="Data Quality" value={`${dataQuality.score}`} icon={<Gauge className="w-5 h-5" />} accent={dataQuality.score >= 90 ? 'emerald' : dataQuality.score >= 75 ? 'amber' : 'red'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader title="Production Trend Analysis" subtitle="Yield percentage over time" />
          <CardBody>
            <TrendChart data={trend} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Accepted vs Rejected" subtitle="Daily production breakdown" />
          <CardBody>
            <ProductionLineChart data={trend} />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader title="Machine Performance" subtitle="Accepted vs rejected by machine" />
          <CardBody>
            <MachineBarChart data={machinePerf} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Shift Distribution" subtitle="Records by shift" />
          <CardBody>
            <ShiftPieChart data={shiftDist} />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DataQualityCard score={dataQuality} />
        <FeatureImportanceCard features={featureImportance} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AIInsightsCard insights={aiInsights} />
        <Card>
          <CardHeader title="Defect Distribution" subtitle="Top defect types by frequency" action={<FileBarChart className="w-4 h-4 text-slate-400" />} />
          <CardBody>
            {defectDist.length > 0 ? (
              <DefectBarChart data={defectDist} />
            ) : (
              <EmptyState title="No defects recorded" description="All production records have been accepted." />
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Shift Summary" subtitle="Production breakdown by shift" />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {shiftDist.map((s) => (
              <div key={s.shift} className="p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{s.shift} Shift</p>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-1">{s.count}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Yield: <span className={`font-medium ${s.yield >= 90 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>{s.yield.toFixed(1)}%</span></p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

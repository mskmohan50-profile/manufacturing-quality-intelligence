import type { ProductionRecord, DashboardKPIs, TrendPoint, MachinePerformance, DataQualityScore, FeatureImportance, AIInsight } from '@/types';

export function computeKPIs(records: ProductionRecord[]): DashboardKPIs {
  const totalRecords = records.length;
  const acceptedParts = records.filter((r) => r.status === 'accepted').length;
  const rejectedParts = records.filter((r) => r.status === 'rejected').length;
  const yieldPercentage = totalRecords > 0 ? (acceptedParts / totalRecords) * 100 : 0;
  const avgCycleTime =
    totalRecords > 0
      ? records.reduce((sum, r) => sum + (r.cycle_time_sec || 0), 0) / totalRecords
      : 0;
  const machineCount = new Set(records.map((r) => r.machine_id)).size;
  const operatorCount = new Set(records.map((r) => r.operator)).size;

  const shiftSummary: Record<string, number> = {};
  for (const r of records) {
    shiftSummary[r.shift] = (shiftSummary[r.shift] ?? 0) + 1;
  }

  return {
    totalRecords,
    acceptedParts,
    rejectedParts,
    yieldPercentage,
    avgCycleTime,
    machineCount,
    operatorCount,
    shiftSummary,
  };
}

export function computeTrend(records: ProductionRecord[]): TrendPoint[] {
  const byDate = new Map<string, { accepted: number; rejected: number }>();
  for (const r of records) {
    const date = r.production_date;
    if (!byDate.has(date)) byDate.set(date, { accepted: 0, rejected: 0 });
    const entry = byDate.get(date)!;
    if (r.status === 'accepted') entry.accepted++;
    else entry.rejected++;
  }

  const sorted = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  return sorted.map(([date, { accepted, rejected }]) => {
    const total = accepted + rejected;
    return {
      date,
      accepted,
      rejected,
      total,
      yield: total > 0 ? (accepted / total) * 100 : 0,
    };
  });
}

export function computeMachinePerformance(records: ProductionRecord[]): MachinePerformance[] {
  const byMachine = new Map<string, ProductionRecord[]>();
  for (const r of records) {
    if (!byMachine.has(r.machine_id)) byMachine.set(r.machine_id, []);
    byMachine.get(r.machine_id)!.push(r);
  }

  const result: MachinePerformance[] = [];
  for (const [machine_id, recs] of byMachine) {
    const total = recs.length;
    const accepted = recs.filter((r) => r.status === 'accepted').length;
    const rejected = total - accepted;
    const yieldPct = total > 0 ? (accepted / total) * 100 : 0;
    const avgCycleTime = recs.reduce((s, r) => s + (r.cycle_time_sec || 0), 0) / total;
    result.push({ machine_id, total, accepted, rejected, yield: yieldPct, avgCycleTime });
  }

  return result.sort((a, b) => b.total - a.total);
}

export function computeShiftDistribution(records: ProductionRecord[]): { shift: string; count: number; yield: number }[] {
  const byShift = new Map<string, { total: number; accepted: number }>();
  for (const r of records) {
    if (!byShift.has(r.shift)) byShift.set(r.shift, { total: 0, accepted: 0 });
    const entry = byShift.get(r.shift)!;
    entry.total++;
    if (r.status === 'accepted') entry.accepted++;
  }

  return [...byShift.entries()].map(([shift, { total, accepted }]) => ({
    shift,
    count: total,
    yield: total > 0 ? (accepted / total) * 100 : 0,
  }));
}

export function computeDefectDistribution(records: ProductionRecord[]): { defect_type: string; count: number }[] {
  const byDefect = new Map<string, number>();
  for (const r of records) {
    if (r.status === 'rejected' && r.defect_type) {
      byDefect.set(r.defect_type, (byDefect.get(r.defect_type) ?? 0) + 1);
    }
  }
  return [...byDefect.entries()]
    .map(([defect_type, count]) => ({ defect_type, count }))
    .sort((a, b) => b.count - a.count);
}

export function computeDataQuality(records: ProductionRecord[]): DataQualityScore {
  if (records.length === 0) {
    return { score: 0, completeness: 0, validity: 0, consistency: 0, uniqueness: 0 };
  }

  const fields = ['machine_id', 'operator', 'shift', 'product', 'batch', 'production_date', 'cycle_time_sec', 'status'];
  let filledFields = 0;
  let validFields = 0;
  const totalFields = records.length * fields.length;

  for (const r of records) {
    for (const f of fields) {
      const val = (r as unknown as Record<string, unknown>)[f];
      if (val !== null && val !== undefined && String(val).trim() !== '') {
        filledFields++;
        if (f === 'status' && (val === 'accepted' || val === 'rejected')) validFields++;
        else if (f === 'cycle_time_sec' && Number(val) >= 0) validFields++;
        else if (f !== 'status' && f !== 'cycle_time_sec') validFields++;
      }
    }
  }

  const completeness = (filledFields / totalFields) * 100;
  const validity = filledFields > 0 ? (validFields / filledFields) * 100 : 0;

  const batchSet = new Set<string>();
  let duplicates = 0;
  for (const r of records) {
    if (batchSet.has(r.batch)) duplicates++;
    else batchSet.add(r.batch);
  }
  const uniqueness = ((records.length - duplicates) / records.length) * 100;

  const validShifts = records.filter((r) => ['Morning', 'Afternoon', 'Night'].includes(r.shift)).length;
  const consistency = (validShifts / records.length) * 100;

  const score = (completeness * 0.3 + validity * 0.3 + consistency * 0.2 + uniqueness * 0.2);

  return {
    score: Math.round(score * 10) / 10,
    completeness: Math.round(completeness * 10) / 10,
    validity: Math.round(validity * 10) / 10,
    consistency: Math.round(consistency * 10) / 10,
    uniqueness: Math.round(uniqueness * 10) / 10,
  };
}

export function computeFeatureImportance(records: ProductionRecord[]): FeatureImportance[] {
  if (records.length === 0) return [];

  const rejected = records.filter((r) => r.status === 'rejected');
  const accepted = records.filter((r) => r.status === 'accepted');
  const rejectRate = rejected.length / records.length;

  const features: { key: keyof ProductionRecord; label: string }[] = [
    { key: 'temperature', label: 'Temperature' },
    { key: 'pressure', label: 'Pressure' },
    { key: 'vibration', label: 'Vibration' },
    { key: 'cycle_time_sec', label: 'Cycle Time' },
  ];

  return features.map(({ key, label }) => {
    const rejectedVals = rejected.map((r) => Number((r as unknown as Record<string, unknown>)[key] ?? 0)).filter((v) => !isNaN(v));
    const acceptedVals = accepted.map((r) => Number((r as unknown as Record<string, unknown>)[key] ?? 0)).filter((v) => !isNaN(v));

    const rejectedMean = rejectedVals.length > 0 ? rejectedVals.reduce((a, b) => a + b, 0) / rejectedVals.length : 0;
    const acceptedMean = acceptedVals.length > 0 ? acceptedVals.reduce((a, b) => a + b, 0) / acceptedVals.length : 0;

    const diff = Math.abs(rejectedMean - acceptedMean);
    const max = Math.max(rejectedMean, acceptedMean, 1);
    const importance = Math.min((diff / max) * 100, 100);
    const direction: 'positive' | 'negative' = rejectedMean >= acceptedMean ? 'positive' : 'negative';

    return { feature: label, importance: Math.round(importance * 10) / 10, direction };
  }).sort((a, b) => b.importance - a.importance);
}

export function generateAIInsights(records: ProductionRecord[]): AIInsight[] {
  if (records.length === 0) return [];

  const insights: AIInsight[] = [];
  const kpis = computeKPIs(records);
  const machinePerf = computeMachinePerformance(records);
  const trend = computeTrend(records);

  if (kpis.yieldPercentage < 90) {
    insights.push({
      id: 'low-yield',
      title: 'Yield Below Target',
      description: `Overall yield is ${kpis.yieldPercentage.toFixed(1)}%, which is below the 90% target. Investigate top defect types and machine-specific issues.`,
      severity: kpis.yieldPercentage < 80 ? 'critical' : 'warning',
      category: 'yield',
    });
  } else {
    insights.push({
      id: 'healthy-yield',
      title: 'Healthy Yield Rate',
      description: `Yield is at ${kpis.yieldPercentage.toFixed(1)}%, performing above the 90% industry benchmark.`,
      severity: 'info',
      category: 'yield',
    });
  }

  const worstMachine = [...machinePerf].sort((a, b) => a.yield - b.yield)[0];
  if (worstMachine && worstMachine.yield < 85) {
    insights.push({
      id: 'machine-issue',
      title: `Machine ${worstMachine.machine_id} Underperforming`,
      description: `Machine ${worstMachine.machine_id} has a yield of ${worstMachine.yield.toFixed(1)}% across ${worstMachine.total} parts. Consider maintenance review.`,
      severity: 'warning',
      category: 'machine',
    });
  }

  const operatorStats = new Map<string, { total: number; rejected: number }>();
  for (const r of records) {
    if (!operatorStats.has(r.operator)) operatorStats.set(r.operator, { total: 0, rejected: 0 });
    const s = operatorStats.get(r.operator)!;
    s.total++;
    if (r.status === 'rejected') s.rejected++;
  }
  const worstOperator = [...operatorStats.entries()]
    .map(([op, s]) => ({ op, rejectRate: s.rejected / s.total }))
    .sort((a, b) => b.rejectRate - a.rejectRate)[0];
  if (worstOperator && worstOperator.rejectRate > 0.15) {
    insights.push({
      id: 'operator-issue',
      title: `Operator ${worstOperator.op} High Reject Rate`,
      description: `Operator ${worstOperator.op} has a ${(worstOperator.rejectRate * 100).toFixed(1)}% reject rate. Additional training may be needed.`,
      severity: 'warning',
      category: 'operator',
    });
  }

  if (trend.length >= 2) {
    const recent = trend.slice(-3);
    const avgRecent = recent.reduce((s, p) => s + p.yield, 0) / recent.length;
    const older = trend.slice(0, Math.max(1, trend.length - 3));
    const avgOlder = older.length > 0 ? older.reduce((s, p) => s + p.yield, 0) / older.length : avgRecent;
    if (avgRecent < avgOlder - 5) {
      insights.push({
        id: 'declining-trend',
        title: 'Declining Yield Trend',
        description: `Average yield dropped from ${avgOlder.toFixed(1)}% to ${avgRecent.toFixed(1)}% in recent production. Investigate process changes.`,
        severity: 'critical',
        category: 'trend',
      });
    }
  }

  const shiftDist = computeShiftDistribution(records);
  const worstShift = [...shiftDist].sort((a, b) => a.yield - b.yield)[0];
  if (worstShift && worstShift.yield < 85) {
    insights.push({
      id: 'shift-issue',
      title: `${worstShift.shift} Shift Underperforming`,
      description: `The ${worstShift.shift} shift has the lowest yield at ${worstShift.yield.toFixed(1)}%. Review staffing and supervision during this period.`,
      severity: 'warning',
      category: 'process',
    });
  }

  return insights;
}

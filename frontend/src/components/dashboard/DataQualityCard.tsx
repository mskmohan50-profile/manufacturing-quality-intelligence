import { Gauge } from 'lucide-react';
import type { DataQualityScore } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

interface DataQualityCardProps {
  score: DataQualityScore;
}

export function DataQualityCard({ score }: DataQualityCardProps) {
  const getGrade = (s: number) => {
    if (s >= 90) return { label: 'Excellent', color: 'text-emerald-600 dark:text-emerald-400' };
    if (s >= 75) return { label: 'Good', color: 'text-blue-600 dark:text-blue-400' };
    if (s >= 60) return { label: 'Fair', color: 'text-amber-600 dark:text-amber-400' };
    return { label: 'Poor', color: 'text-red-600 dark:text-red-400' };
  };
  const grade = getGrade(score.score);

  const metrics = [
    { label: 'Completeness', value: score.completeness, color: 'bg-emerald-500' },
    { label: 'Validity', value: score.validity, color: 'bg-blue-500' },
    { label: 'Consistency', value: score.consistency, color: 'bg-violet-500' },
    { label: 'Uniqueness', value: score.uniqueness, color: 'bg-amber-500' },
  ];

  return (
    <Card>
      <CardHeader title="Data Quality Score" subtitle="Overall data integrity assessment" />
      <CardBody>
        <div className="flex items-center gap-4 mb-5">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" className="text-slate-200 dark:text-slate-800" />
              <circle
                cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3"
                className={grade.color}
                strokeDasharray={`${(score.score / 100) * 97.4} 97.4`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-slate-800 dark:text-slate-100">{score.score}</span>
            </div>
          </div>
          <div>
            <div className={`text-lg font-semibold ${grade.color}`}>{grade.label}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
              <Gauge className="w-3 h-3" />
              Based on {4} quality dimensions
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {metrics.map((m) => (
            <div key={m.label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-600 dark:text-slate-300">{m.label}</span>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{m.value.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div className={`h-full rounded-full ${m.color} transition-all duration-500`} style={{ width: `${m.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

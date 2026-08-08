import { BarChart3 } from 'lucide-react';
import type { FeatureImportance } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';

interface FeatureImportanceCardProps {
  features: FeatureImportance[];
}

export function FeatureImportanceCard({ features }: FeatureImportanceCardProps) {
  return (
    <Card>
      <CardHeader
        title="Feature Importance (SHAP-style)"
        subtitle="Factors influencing rejection probability"
        action={<BarChart3 className="w-4 h-4 text-slate-400" />}
      />
      <CardBody>
        {features.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">No data available for analysis.</p>
        ) : (
          <div className="space-y-4">
            {features.map((f) => (
              <div key={f.feature}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{f.feature}</span>
                  <span className={`text-xs font-medium ${f.direction === 'positive' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {f.direction === 'positive' ? '↑ Increases' : '↓ Decreases'} reject risk
                  </span>
                </div>
                <div className="relative h-6 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`absolute top-0 bottom-0 left-0 rounded-lg transition-all duration-700 ${
                      f.direction === 'positive'
                        ? 'bg-gradient-to-r from-red-400 to-red-500'
                        : 'bg-gradient-to-r from-emerald-400 to-emerald-500'
                    }`}
                    style={{ width: `${Math.max(f.importance, 3)}%` }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-600 dark:text-slate-300">
                    {f.importance.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
            <p className="text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
              Mocked SHAP values showing relative contribution of each feature to rejection probability.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

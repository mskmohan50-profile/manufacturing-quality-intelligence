import { Sparkles, TrendingDown, AlertTriangle, Info, Lightbulb } from 'lucide-react';
import type { AIInsight } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface AIInsightsCardProps {
  insights: AIInsight[];
}

const severityConfig = {
  critical: { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800' },
  warning: { icon: TrendingDown, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800' },
};

const categoryColors: Record<string, 'default' | 'success' | 'warning' | 'error' | 'info'> = {
  yield: 'info',
  machine: 'warning',
  operator: 'default',
  process: 'warning',
  trend: 'error',
};

export function AIInsightsCard({ insights }: AIInsightsCardProps) {
  return (
    <Card>
      <CardHeader
        title="AI-Generated Production Insights"
        subtitle="Automated analysis of production patterns"
        action={<Badge variant="info"><Sparkles className="w-3 h-3" /> AI</Badge>}
      />
      <CardBody>
        {insights.length === 0 ? (
          <div className="flex flex-col items-center text-center py-6">
            <Lightbulb className="w-8 h-8 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-500 dark:text-slate-400">No insights available. Upload data to generate analysis.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => {
              const config = severityConfig[insight.severity];
              const Icon = config.icon;
              return (
                <div key={insight.id} className={`flex items-start gap-3 p-3 rounded-lg border ${config.bg} ${config.border}`}>
                  <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.color}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-200">{insight.title}</h4>
                      <Badge variant={categoryColors[insight.category] ?? 'default'} className="capitalize">{insight.category}</Badge>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400">{insight.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
}

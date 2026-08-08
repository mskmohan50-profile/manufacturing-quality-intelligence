import { CheckCircle, AlertTriangle, XCircle, FileCheck, FileWarning } from 'lucide-react';
import type { ValidationSummary } from '@/types';
import { Card } from '@/components/ui/Card';

interface ValidationSummaryCardProps {
  summary: ValidationSummary;
  fileName: string;
}

export function ValidationSummaryCard({ summary, fileName }: ValidationSummaryCardProps) {
  const hasMissingColumns = summary.missingColumns.length > 0;
  const allValid = summary.invalidRows === 0 && !hasMissingColumns;

  return (
    <Card className="p-5">
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${allValid ? 'bg-emerald-100 dark:bg-emerald-950/50' : 'bg-amber-100 dark:bg-amber-950/50'}`}>
          {allValid ? <FileCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" /> : <FileWarning className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Validation Summary</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{fileName}</p>
        </div>
      </div>

      {hasMissingColumns && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 mb-4">
          <p className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">Missing required columns:</p>
          <p className="text-xs text-red-600 dark:text-red-500">{summary.missingColumns.join(', ')}</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryItem icon={<CheckCircle className="w-4 h-4" />} label="Valid" value={summary.validRows} color="text-emerald-600 dark:text-emerald-400" />
        <SummaryItem icon={<XCircle className="w-4 h-4" />} label="Invalid" value={summary.invalidRows} color="text-red-600 dark:text-red-400" />
        <SummaryItem icon={<AlertTriangle className="w-4 h-4" />} label="Warnings" value={summary.warningRows} color="text-amber-600 dark:text-amber-400" />
        <SummaryItem icon={<FileCheck className="w-4 h-4" />} label="Total" value={summary.totalRows} color="text-slate-600 dark:text-slate-300" />
      </div>

      {(summary.missingValues > 0 || summary.duplicateRows > 0) && (
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
          {summary.missingValues > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Missing values</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">{summary.missingValues}</span>
            </div>
          )}
          {summary.duplicateRows > 0 && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400">Duplicate batches</span>
              <span className="font-medium text-amber-600 dark:text-amber-400">{summary.duplicateRows}</span>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function SummaryItem({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
      <div className={`${color} mb-1`}>{icon}</div>
      <span className="text-lg font-bold text-slate-800 dark:text-slate-100">{value}</span>
      <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
    </div>
  );
}

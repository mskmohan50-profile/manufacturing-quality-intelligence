import { useState } from 'react';
import { ChevronRight, AlertTriangle, XCircle, CheckCircle } from 'lucide-react';
import type { ValidatedRow } from '@/types';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface DataPreviewTableProps {
  rows: ValidatedRow[];
  maxRows?: number;
}

export function DataPreviewTable({ rows, maxRows = 50 }: DataPreviewTableProps) {
  const [selectedRow, setSelectedRow] = useState<ValidatedRow | null>(null);
  const displayRows = rows.slice(0, maxRows);

  if (displayRows.length === 0) return null;

  const headers = Object.keys(displayRows[0].raw);

  return (
    <>
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
              <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">#</th>
              <th className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400">Status</th>
              {headers.map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayRows.map((row) => (
              <tr
                key={row.rowIndex}
                onClick={() => setSelectedRow(row)}
                className="hover:bg-slate-50 dark:hover:bg-slate-800/30 cursor-pointer transition-colors"
              >
                <td className="px-3 py-2 text-xs text-slate-500 dark:text-slate-400">{row.rowIndex}</td>
                <td className="px-3 py-2">
                  {row.status === 'valid' && (
                    <Badge variant="success"><CheckCircle className="w-3 h-3" /> Valid</Badge>
                  )}
                  {row.status === 'warning' && (
                    <Badge variant="warning"><AlertTriangle className="w-3 h-3" /> Warning</Badge>
                  )}
                  {row.status === 'invalid' && (
                    <Badge variant="error"><XCircle className="w-3 h-3" /> Invalid</Badge>
                  )}
                </td>
                {headers.map((h) => {
                  const val = row.raw[h];
                  const isEmpty = val === null || val === undefined || String(val).trim() === '';
                  return (
                    <td key={h} className={`px-3 py-2 text-xs whitespace-nowrap max-w-[200px] truncate ${isEmpty ? 'text-red-400 dark:text-red-500 italic' : 'text-slate-700 dark:text-slate-300'}`}>
                      {isEmpty ? '— missing —' : String(val)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {rows.length > maxRows && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
          Showing first {maxRows} of {rows.length} rows
        </p>
      )}

      <Modal open={!!selectedRow} onClose={() => setSelectedRow(null)} title={`Row ${selectedRow?.rowIndex} Details`} size="lg">
        {selectedRow && (
          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Row Status</h4>
              {selectedRow.status === 'valid' && <Badge variant="success"><CheckCircle className="w-3 h-3" /> Valid</Badge>}
              {selectedRow.status === 'warning' && <Badge variant="warning"><AlertTriangle className="w-3 h-3" /> Warning</Badge>}
              {selectedRow.status === 'invalid' && <Badge variant="error"><XCircle className="w-3 h-3" /> Invalid</Badge>}
            </div>

            {selectedRow.errors.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Issues Found</h4>
                <ul className="space-y-1">
                  {selectedRow.errors.map((err, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                      <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase mb-2">Raw Data</h4>
              <div className="rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {Object.entries(selectedRow.raw).map(([k, v]) => (
                      <tr key={k}>
                        <td className="px-3 py-1.5 font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 w-1/3">{k}</td>
                        <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300">{v === null || v === undefined || String(v).trim() === '' ? '—' : String(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}

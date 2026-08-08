import { useCallback, useState } from 'react';
import { Upload, CheckCircle2, AlertTriangle, FileUp, Download } from 'lucide-react';
import { FileDropzone, UndoButton } from '@/components/upload/FileDropzone';
import { ValidationSummaryCard } from '@/components/upload/ValidationSummaryCard';
import { DataPreviewTable } from '@/components/upload/DataPreviewTable';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { parseFile, exportToCSV } from '@/lib/fileParser';
import { validateData, getValidRecords } from '@/lib/validation';
import { logAudit } from '@/lib/audit';
import { api } from '@/lib/api';
import type { UploadResult } from '@/types';

interface UploadPageProps {
  onUploadComplete: () => void;
}

export function UploadPage({ onUploadComplete }: UploadPageProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [result, setResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [undoStack, setUndoStack] = useState<UploadResult[]>([]);

  const handleFile = useCallback(async (file: File) => {
    setLoading(true);
    setResult(null);
    try {
      const parsed = await parseFile(file);
      const validationResult = validateData(parsed.rows, parsed.fileName, parsed.fileSize);
      setResult(validationResult);

      if (validationResult.summary.missingColumns.length > 0) {
        toast('error', `Missing required columns: ${validationResult.summary.missingColumns.join(', ')}`);
      } else if (validationResult.summary.invalidRows > 0) {
        toast('warning', `${validationResult.summary.invalidRows} invalid rows detected. Review before saving.`);
      } else {
        toast('success', `File parsed successfully. ${validationResult.summary.validRows} valid rows ready.`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to parse file.';
      toast('error', msg);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleSave = async () => {
    if (!result) return;
    setUploading(true);
    try {
      const validRecords = getValidRecords(result);
      if (validRecords.length === 0) {
        toast('error', 'No valid records to save.');
        setUploading(false);
        return;
      }

      await api.post('/api/records', validRecords);

      await logAudit('upload', 'production_record', null, {
        fileName: result.fileName,
        totalRows: result.summary.totalRows,
        validRows: validRecords.length,
        invalidRows: result.summary.invalidRows,
      });

      toast('success', `${validRecords.length} records saved successfully.`);
      setUndoStack((prev) => [...prev, result]);
      setResult(null);
      onUploadComplete();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to save records.';
      toast('error', msg);
    } finally {
      setUploading(false);
    }
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setResult(last);
    setUndoStack((prev) => prev.slice(0, -1));
    toast('info', 'Restored previous upload preview.');
  };

  const handleDownloadTemplate = () => {
    const sample = [
      { machine_id: 'M-001', operator: 'John Doe', shift: 'Morning', product: 'Widget-A', batch: 'B-1001', production_date: '2024-01-15', cycle_time_sec: 45.2, status: 'accepted', defect_type: '', temperature: 72.5, pressure: 4.1, vibration: 0.8 },
      { machine_id: 'M-002', operator: 'Jane Smith', shift: 'Afternoon', product: 'Widget-B', batch: 'B-1002', production_date: '2024-01-15', cycle_time_sec: 52.1, status: 'rejected', defect_type: 'Surface Finish', temperature: 78.3, pressure: 4.5, vibration: 1.2 },
    ];
    exportToCSV(sample as unknown as Record<string, unknown>[], 'qeltrava-upload-template.csv');
    toast('info', 'Template downloaded.');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Upload Production Data</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Upload CSV or Excel files to validate and import production records.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
            <Download className="w-3.5 h-3.5" />
            Template
          </Button>
          {undoStack.length > 0 && <UndoButton onUndo={handleUndo} />}
        </div>
      </div>

      <Card>
        <CardBody>
          <FileDropzone onFileSelected={handleFile} loading={loading} />
        </CardBody>
      </Card>

      {result && (
        <>
          <ValidationSummaryCard summary={result.summary} fileName={result.fileName} />

          {result.summary.missingColumns.length === 0 && (
            <>
              <Card>
                <CardBody>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Data Preview</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="success">{result.summary.validRows} valid</Badge>
                      {result.summary.warningRows > 0 && <Badge variant="warning">{result.summary.warningRows} warnings</Badge>}
                      {result.summary.invalidRows > 0 && <Badge variant="error">{result.summary.invalidRows} invalid</Badge>}
                    </div>
                  </div>
                  <DataPreviewTable rows={result.rows} />
                </CardBody>
              </Card>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button onClick={handleSave} loading={uploading} size="lg" className="flex-1">
                  <FileUp className="w-4 h-4" />
                  Save {result.summary.validRows + result.summary.warningRows} Records
                </Button>
                <Button variant="outline" size="lg" onClick={() => setResult(null)} disabled={uploading}>
                  Cancel
                </Button>
              </div>
            </>
          )}

          {result.summary.missingColumns.length > 0 && (
            <Card>
              <CardBody>
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200">File cannot be processed</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      The uploaded file is missing required columns: <span className="font-medium text-red-600 dark:text-red-400">{result.summary.missingColumns.join(', ')}</span>.
                      Please ensure your file includes all required columns and try again.
                    </p>
                  </div>
                </div>
              </CardBody>
            </Card>
          )}
        </>
      )}

      {!result && !loading && undoStack.length === 0 && (
        <Card>
          <CardBody>
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center mb-3">
                <Upload className="w-6 h-6 text-blue-500" />
              </div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-200">Ready to upload</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
                Upload a CSV or Excel file with columns: machine_id, operator, shift, product, batch, production_date, cycle_time_sec, status.
                Optional columns: defect_type, temperature, pressure, vibration.
              </p>
              <div className="flex items-center gap-4 mt-4 text-xs text-slate-400 dark:text-slate-500">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Auto-validation</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Drag & drop</span>
                <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Error highlighting</span>
              </div>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

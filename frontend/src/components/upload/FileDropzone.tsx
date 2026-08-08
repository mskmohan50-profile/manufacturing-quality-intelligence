import { useCallback, useState, type DragEvent } from 'react';
import { UploadCloud, FileText, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FileDropzoneProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  loading?: boolean;
}

export function FileDropzone({ onFileSelected, disabled, loading }: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDragging(false);
      if (disabled || loading) return;

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        setSelectedFileName(files[0].name);
        onFileSelected(files[0]);
      }
    },
    [onFileSelected, disabled, loading]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileName(file.name);
      onFileSelected(file);
    }
  };

  const clearSelection = () => setSelectedFileName(null);

  return (
    <div className="w-full">
      <div
        onDragOver={(e) => { e.preventDefault(); if (!disabled && !loading) setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${
          dragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/30'
            : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30'
        } ${disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400'}`}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleChange}
          disabled={disabled || loading}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label="Upload CSV or Excel file"
        />
        <div className="flex flex-col items-center gap-3">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${dragging ? 'bg-blue-100 dark:bg-blue-900' : 'bg-slate-100 dark:bg-slate-800'}`}>
            <UploadCloud className={`w-6 h-6 ${dragging ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
              {loading ? 'Processing file...' : 'Drag & drop your file here'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              or click to browse — supports CSV, XLSX
            </p>
          </div>
        </div>
      </div>

      {selectedFileName && !loading && (
        <div className="flex items-center gap-2 mt-3 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm text-slate-600 dark:text-slate-300 flex-1 truncate">{selectedFileName}</span>
          <button onClick={clearSelection} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" aria-label="Clear file selection">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 mt-3">
          <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 dark:text-slate-400">Parsing and validating data...</span>
        </div>
      )}
    </div>
  );
}

interface UndoButtonProps {
  onUndo: () => void;
}

export function UndoButton({ onUndo }: UndoButtonProps) {
  return (
    <Button variant="outline" size="sm" onClick={onUndo}>
      <X className="w-3.5 h-3.5" />
      Undo Upload
    </Button>
  );
}

import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { RawRow } from '@/types';

export interface ParsedFile {
  rows: RawRow[];
  headers: string[];
  fileName: string;
  fileSize: number;
}

export async function parseCSV(file: File): Promise<ParsedFile> {
  return new Promise((resolve, reject) => {
    Papa.parse<RawRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields ?? [];
        const rows = results.data ?? [];
        if (rows.length === 0) {
          reject(new Error('CSV file contains no data rows.'));
          return;
        }
        resolve({ rows, headers, fileName: file.name, fileSize: file.size });
      },
      error: (err) => reject(new Error(`CSV parse error: ${err.message}`)),
    });
  });
}

export async function parseExcel(file: File): Promise<ParsedFile> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) throw new Error('Excel file contains no sheets.');

  const sheet = workbook.Sheets[firstSheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  if (json.length === 0) throw new Error('Excel sheet contains no data rows.');

  const headers = Object.keys(json[0] ?? {});
  const rows: RawRow[] = json.map((row) => {
    const normalized: RawRow = {};
    for (const [k, v] of Object.entries(row)) {
      normalized[k] = v === null ? null : String(v ?? '');
    }
    return normalized;
  });

  return { rows, headers, fileName: file.name, fileSize: file.size };
}

export async function parseFile(file: File): Promise<ParsedFile> {
  const ext = file.name.toLowerCase().split('.').pop();
  if (ext === 'csv') return parseCSV(file);
  if (ext === 'xlsx' || ext === 'xls') return parseExcel(file);
  throw new Error(`Unsupported file type: .${ext}. Please upload a CSV or Excel file.`);
}

export function exportToCSV(rows: Record<string, unknown>[], filename: string): void {
  if (rows.length === 0) return;
  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, filename);
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

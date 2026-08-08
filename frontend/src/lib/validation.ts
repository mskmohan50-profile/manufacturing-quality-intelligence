import type {
  ProductionRecord,
  RawRow,
  ValidatedRow,
  ValidationSummary,
  UploadResult,
  RowStatus,
} from '@/types';

const REQUIRED_COLUMNS = [
  'machine_id',
  'operator',
  'shift',
  'product',
  'batch',
  'production_date',
  'cycle_time_sec',
  'status',
];

const COLUMN_ALIASES: Record<string, string> = {
  machine: 'machine_id',
  machineid: 'machine_id',
  machine_id: 'machine_id',
  operator: 'operator',
  operator_name: 'operator',
  shift: 'shift',
  product: 'product',
  product_name: 'product',
  productname: 'product',
  batch: 'batch',
  batch_number: 'batch',
  batchnumber: 'batch',
  date: 'production_date',
  production_date: 'production_date',
  productiondate: 'production_date',
  cycle: 'cycle_time_sec',
  cycletime: 'cycle_time_sec',
  cycle_time: 'cycle_time_sec',
  cycle_time_sec: 'cycle_time_sec',
  status: 'status',
  result: 'status',
  defect: 'defect_type',
  defect_type: 'defect_type',
  defecttype: 'defect_type',
  temp: 'temperature',
  temperature: 'temperature',
  pressure: 'pressure',
  vibration: 'vibration',
};

const VALID_SHIFTS = ['morning', 'afternoon', 'night'];
const VALID_STATUSES = ['accepted', 'rejected', 'pass', 'fail', 'ok', 'good', 'reject'];

function normalizeKey(key: string): string {
  const lower = key.toLowerCase().trim().replace(/\s+/g, '_');
  return COLUMN_ALIASES[lower] ?? lower;
}

export function normalizeHeaders(headers: string[]): string[] {
  return headers.map((h) => normalizeKey(h));
}

export function normalizeRows(rawRows: RawRow[]): RawRow[] {
  return rawRows.map((row) => {
    const normalized: RawRow = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeKey(key)] = value;
    }
    return normalized;
  });
}

function parseShift(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const lower = String(value).toLowerCase().trim();
  if (VALID_SHIFTS.includes(lower)) {
    return lower.charAt(0).toUpperCase() + lower.slice(1);
  }
  return null;
}

function parseStatus(value: unknown): 'accepted' | 'rejected' | null {
  if (value === null || value === undefined || value === '') return null;
  const lower = String(value).toLowerCase().trim();
  if (['accepted', 'pass', 'ok', 'good'].includes(lower)) return 'accepted';
  if (['rejected', 'fail', 'reject'].includes(lower)) return 'rejected';
  return null;
}

function parseDate(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  const dateStr = String(value).trim();
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;
  return date.toISOString().split('T')[0];
}

function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(String(value).trim());
  return isNaN(num) ? null : num;
}

export function validateRow(
  raw: RawRow,
  rowIndex: number,
  seenBatches: Set<string>
): ValidatedRow {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const col of REQUIRED_COLUMNS) {
    if (raw[col] === null || raw[col] === undefined || String(raw[col]).trim() === '') {
      errors.push(`Missing required column: ${col}`);
    }
  }

  const shift = parseShift(raw.shift);
  if (raw.shift && !shift) {
    errors.push(`Invalid shift value: "${raw.shift}"`);
  }

  const status = parseStatus(raw.status);
  if (raw.status && !status) {
    errors.push(`Invalid status value: "${raw.status}"`);
  }

  const date = parseDate(raw.production_date);
  if (raw.production_date && !date) {
    errors.push(`Invalid date format: "${raw.production_date}"`);
  }

  const cycleTime = parseNumber(raw.cycle_time_sec);
  if (raw.cycle_time_sec && cycleTime === null) {
    errors.push(`Invalid cycle_time_sec value: "${raw.cycle_time_sec}"`);
  } else if (cycleTime !== null && cycleTime < 0) {
    warnings.push('Negative cycle time');
  }

  const batchKey = String(raw.batch ?? '').trim();
  if (batchKey && seenBatches.has(batchKey)) {
    warnings.push(`Duplicate batch: ${batchKey}`);
  } else if (batchKey) {
    seenBatches.add(batchKey);
  }

  const temperature = parseNumber(raw.temperature);
  const pressure = parseNumber(raw.pressure);
  const vibration = parseNumber(raw.vibration);

  let statusResult: RowStatus = 'valid';
  if (errors.length > 0) {
    statusResult = 'invalid';
  } else if (warnings.length > 0) {
    statusResult = 'warning';
  }

  return {
    rowIndex,
    raw,
    status: statusResult,
    errors: [...errors, ...warnings],
    normalized:
      statusResult !== 'invalid'
        ? {
            machine_id: String(raw.machine_id ?? '').trim(),
            operator: String(raw.operator ?? '').trim(),
            shift: (shift ?? 'Morning') as ProductionRecord['shift'],
            product: String(raw.product ?? '').trim(),
            batch: batchKey,
            production_date: date ?? new Date().toISOString().split('T')[0],
            cycle_time_sec: cycleTime ?? 0,
            status: (status ?? 'accepted') as ProductionRecord['status'],
            defect_type: raw.defect_type ? String(raw.defect_type).trim() : null,
            temperature,
            pressure,
            vibration,
          }
        : undefined,
  };
}

export function validateData(rows: RawRow[], fileName: string, fileSize: number): UploadResult {
  const normalized = normalizeRows(rows);
  const headers = normalized.length > 0 ? Object.keys(normalized[0]) : [];
  const headerSet = new Set(headers.map((h) => h.toLowerCase()));

  const missingColumns = REQUIRED_COLUMNS.filter((c) => !headerSet.has(c));
  const invalidColumns: string[] = [];

  const seenBatches = new Set<string>();
  const validatedRows: ValidatedRow[] = normalized.map((row, idx) =>
    validateRow(row, idx + 1, seenBatches)
  );

  const validRows = validatedRows.filter((r) => r.status === 'valid').length;
  const invalidRows = validatedRows.filter((r) => r.status === 'invalid').length;
  const warningRows = validatedRows.filter((r) => r.status === 'warning').length;

  let missingValues = 0;
  for (const row of normalized) {
    for (const col of REQUIRED_COLUMNS) {
      if (row[col] === null || row[col] === undefined || String(row[col]).trim() === '') {
        missingValues++;
      }
    }
  }

  const batchSet = new Set<string>();
  let duplicateRows = 0;
  for (const row of normalized) {
    const b = String(row.batch ?? '').trim();
    if (b && batchSet.has(b)) duplicateRows++;
    else if (b) batchSet.add(b);
  }

  const summary: ValidationSummary = {
    totalRows: normalized.length,
    validRows,
    invalidRows,
    warningRows,
    missingValues,
    invalidColumns,
    missingColumns,
    duplicateRows,
  };

  return { rows: validatedRows, summary, fileName, fileSize };
}

export function getValidRecords(result: UploadResult): Partial<ProductionRecord>[] {
  return result.rows
    .filter((r) => r.status !== 'invalid' && r.normalized)
    .map((r) => r.normalized!) as Partial<ProductionRecord>[];
}

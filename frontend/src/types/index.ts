export type Shift = 'Morning' | 'Afternoon' | 'Night';

export type RecordStatus = 'accepted' | 'rejected';

export interface ProductionRecord {
  id: string;
  user_id: string;
  machine_id: string;
  operator: string;
  shift: Shift;
  product: string;
  batch: string;
  production_date: string;
  cycle_time_sec: number;
  status: RecordStatus;
  defect_type: string | null;
  temperature: number | null;
  pressure: number | null;
  vibration: number | null;
  created_at: string;
}

export interface RawRow {
  [key: string]: string | number | null | undefined;
}

export type RowStatus = 'valid' | 'invalid' | 'warning';

export interface ValidatedRow {
  rowIndex: number;
  raw: RawRow;
  status: RowStatus;
  errors: string[];
  normalized?: Partial<ProductionRecord>;
}

export interface ValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  warningRows: number;
  missingValues: number;
  invalidColumns: string[];
  missingColumns: string[];
  duplicateRows: number;
}

export interface UploadResult {
  rows: ValidatedRow[];
  summary: ValidationSummary;
  fileName: string;
  fileSize: number;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface DashboardKPIs {
  totalRecords: number;
  acceptedParts: number;
  rejectedParts: number;
  yieldPercentage: number;
  avgCycleTime: number;
  machineCount: number;
  operatorCount: number;
  shiftSummary: Record<string, number>;
}

export interface TrendPoint {
  date: string;
  accepted: number;
  rejected: number;
  total: number;
  yield: number;
}

export interface MachinePerformance {
  machine_id: string;
  total: number;
  accepted: number;
  rejected: number;
  yield: number;
  avgCycleTime: number;
}

export interface FilterState {
  search: string;
  machineId: string;
  operator: string;
  shift: string;
  product: string;
  batch: string;
  startDate: string;
  endDate: string;
  status: string;
}

export interface DataQualityScore {
  score: number;
  completeness: number;
  validity: number;
  consistency: number;
  uniqueness: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
  direction: 'positive' | 'negative';
}

export interface AIInsight {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  category: 'yield' | 'machine' | 'operator' | 'process' | 'trend';
}

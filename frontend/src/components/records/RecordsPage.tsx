import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Filter, X, ChevronLeft, ChevronRight, Download, FileText, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/context/ToastContext';
import { logAudit } from '@/lib/audit';
import { exportToCSV } from '@/lib/fileParser';
import { exportPDFReport } from '@/lib/pdfExport';
import { computeKPIs } from '@/lib/analytics';
import type { ProductionRecord, FilterState } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SkeletonTable } from '@/components/ui/Skeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyState } from '@/components/ui/EmptyState';

const PAGE_SIZE = 20;

const initialFilters: FilterState = {
  search: '',
  machineId: '',
  operator: '',
  shift: '',
  product: '',
  batch: '',
  startDate: '',
  endDate: '',
  status: '',
};

export function RecordsPage() {
  const { toast } = useToast();
  const [records, setRecords] = useState<ProductionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ data: ProductionRecord[] }>('/api/records?limit=5000');
      setRecords(data ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load records.';
      setError(msg);
      toast('error', msg);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  const uniqueValues = useMemo(() => {
    const machines = new Set<string>();
    const operators = new Set<string>();
    const products = new Set<string>();
    const batches = new Set<string>();
    for (const r of records) {
      machines.add(r.machine_id);
      operators.add(r.operator);
      products.add(r.product);
      batches.add(r.batch);
    }
    return {
      machines: [...machines].sort(),
      operators: [...operators].sort(),
      products: [...products].sort(),
      batches: [...batches].sort(),
    };
  }, [records]);

  const filtered = useMemo(() => {
    let result = records;
    const search = filters.search.toLowerCase().trim();
    if (search) {
      result = result.filter((r) =>
        r.machine_id.toLowerCase().includes(search) ||
        r.operator.toLowerCase().includes(search) ||
        r.product.toLowerCase().includes(search) ||
        r.batch.toLowerCase().includes(search) ||
        (r.defect_type ?? '').toLowerCase().includes(search)
      );
    }
    if (filters.machineId) result = result.filter((r) => r.machine_id === filters.machineId);
    if (filters.operator) result = result.filter((r) => r.operator === filters.operator);
    if (filters.shift) result = result.filter((r) => r.shift === filters.shift);
    if (filters.product) result = result.filter((r) => r.product === filters.product);
    if (filters.batch) result = result.filter((r) => r.batch === filters.batch);
    if (filters.status) result = result.filter((r) => r.status === filters.status);
    if (filters.startDate) result = result.filter((r) => r.production_date >= filters.startDate);
    if (filters.endDate) result = result.filter((r) => r.production_date <= filters.endDate);
    return result;
  }, [records, filters]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFilterCount = Object.entries(filters).filter(([, v]) => v !== '').length;

  const handleClearFilters = () => {
    setFilters(initialFilters);
    setPage(1);
  };

  const handleExportCSV = () => {
    const exportData = filtered.map((r) => ({
      machine_id: r.machine_id,
      operator: r.operator,
      shift: r.shift,
      product: r.product,
      batch: r.batch,
      production_date: r.production_date,
      cycle_time_sec: r.cycle_time_sec,
      status: r.status,
      defect_type: r.defect_type ?? '',
      temperature: r.temperature ?? '',
      pressure: r.pressure ?? '',
      vibration: r.vibration ?? '',
    }));
    exportToCSV(exportData as unknown as Record<string, unknown>[], `production-records-${Date.now()}.csv`);
    logAudit('export_csv', 'production_record', null, { count: filtered.length });
    toast('success', `Exported ${filtered.length} records to CSV.`);
  };

  const handleExportPDF = () => {
    const kpis = computeKPIs(filtered);
    exportPDFReport(filtered, kpis, `production-report-${Date.now()}.pdf`);
    logAudit('export_pdf', 'production_record', null, { count: filtered.length });
    toast('success', 'PDF report generated.');
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const ids = [...selectedIds];
    try {
      await api.delete('/api/records', { ids });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete records.';
      toast('error', msg);
      return;
    }
    await logAudit('delete', 'production_record', null, { count: ids.length, ids });
    toast('success', `Deleted ${ids.length} records.`);
    setSelectedIds(new Set());
    fetchRecords();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paged.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paged.map((r) => r.id)));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Production Records</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{filtered.length.toLocaleString()} records found</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={filtered.length === 0}>
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={filtered.length === 0}>
            <FileText className="w-3.5 h-3.5" /> PDF
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="danger" size="sm" onClick={handleDeleteSelected}>
              <Trash2 className="w-3.5 h-3.5" /> Delete ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardBody>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by machine, operator, product, batch, or defect..."
                value={filters.search}
                onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
                className="pl-10"
              />
            </div>
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="primary" className="ml-1 bg-blue-600 text-white">{activeFilterCount}</Badge>
              )}
            </Button>
            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                <X className="w-3.5 h-3.5" /> Clear
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <Select
                label="Machine"
                value={filters.machineId}
                onChange={(e) => { setFilters({ ...filters, machineId: e.target.value }); setPage(1); }}
                options={[{ value: '', label: 'All Machines' }, ...uniqueValues.machines.map((m) => ({ value: m, label: m }))]}
              />
              <Select
                label="Operator"
                value={filters.operator}
                onChange={(e) => { setFilters({ ...filters, operator: e.target.value }); setPage(1); }}
                options={[{ value: '', label: 'All Operators' }, ...uniqueValues.operators.map((o) => ({ value: o, label: o }))]}
              />
              <Select
                label="Shift"
                value={filters.shift}
                onChange={(e) => { setFilters({ ...filters, shift: e.target.value }); setPage(1); }}
                options={[{ value: '', label: 'All Shifts' }, { value: 'Morning', label: 'Morning' }, { value: 'Afternoon', label: 'Afternoon' }, { value: 'Night', label: 'Night' }]}
              />
              <Select
                label="Product"
                value={filters.product}
                onChange={(e) => { setFilters({ ...filters, product: e.target.value }); setPage(1); }}
                options={[{ value: '', label: 'All Products' }, ...uniqueValues.products.map((p) => ({ value: p, label: p }))]}
              />
              <Select
                label="Status"
                value={filters.status}
                onChange={(e) => { setFilters({ ...filters, status: e.target.value }); setPage(1); }}
                options={[{ value: '', label: 'All Statuses' }, { value: 'accepted', label: 'Accepted' }, { value: 'rejected', label: 'Rejected' }]}
              />
              <Input
                label="Start Date"
                type="date"
                value={filters.startDate}
                onChange={(e) => { setFilters({ ...filters, startDate: e.target.value }); setPage(1); }}
              />
              <Input
                label="End Date"
                type="date"
                value={filters.endDate}
                onChange={(e) => { setFilters({ ...filters, endDate: e.target.value }); setPage(1); }}
              />
              <Select
                label="Batch"
                value={filters.batch}
                onChange={(e) => { setFilters({ ...filters, batch: e.target.value }); setPage(1); }}
                options={[{ value: '', label: 'All Batches' }, ...uniqueValues.batches.map((b) => ({ value: b, label: b }))]}
              />
            </div>
          )}
        </CardBody>
      </Card>

      {loading ? (
        <SkeletonTable rows={8} />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRecords} />
      ) : filtered.length === 0 ? (
        <Card><CardBody>
          <EmptyState
            title="No records found"
            description={activeFilterCount > 0 ? "No records match your current filters. Try adjusting or clearing filters." : "Upload production data to see records here."}
            action={activeFilterCount > 0 ? <Button variant="outline" size="sm" onClick={handleClearFilters}>Clear Filters</Button> : undefined}
          />
        </CardBody></Card>
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-3 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={paged.length > 0 && selectedIds.size === paged.length}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                      aria-label="Select all visible rows"
                    />
                  </th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Date</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Machine</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Operator</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Shift</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Product</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Batch</th>
                  <th className="px-3 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Cycle (s)</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</th>
                  <th className="px-3 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Defect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paged.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-3 py-2.5">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(r.id)}
                        onChange={() => toggleSelect(r.id)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500"
                        aria-label={`Select row for ${r.machine_id}`}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.production_date}</td>
                    <td className="px-3 py-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 whitespace-nowrap">{r.machine_id}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.operator}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.shift}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.product}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">{r.batch}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-300 text-right whitespace-nowrap">{r.cycle_time_sec.toFixed(1)}</td>
                    <td className="px-3 py-2.5">
                      {r.status === 'accepted' ? (
                        <Badge variant="success">Accepted</Badge>
                      ) : (
                        <Badge variant="error">Rejected</Badge>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">{r.defect_type ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages} — showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

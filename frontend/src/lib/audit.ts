import { api } from './api';
import type { AuditLog } from '@/types';

export async function logAudit(
  action: string,
  entityType: string = 'production_record',
  entityId: string | null = null,
  details: Record<string, unknown> | null = null
): Promise<void> {
  try {
    await api.post('/api/audit-logs', {
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
    });
  } catch {
    // Audit logging is best-effort; don't block user flows on failure.
  }
}

export async function fetchAuditLogs(limit: number = 50): Promise<AuditLog[]> {
  const { data } = await api.get<{ data: AuditLog[] }>(`/api/audit-logs?limit=${limit}`);
  return data ?? [];
}

import { Router } from 'express';
import { AuditLog } from '../models/AuditLog.js';
import { requireAuth } from '../middleware/auth.js';

export const auditLogsRouter = Router();
auditLogsRouter.use(requireAuth);

auditLogsRouter.post('/', async (req, res) => {
  try {
    const { action, entity_type, entity_id, details } = req.body;
    const log = await AuditLog.create({
      userId: req.user.id,
      action,
      entityType: entity_type || 'production_record',
      entityId: entity_id ?? null,
      details: details ?? null,
    });
    res.status(201).json({ data: log });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to write audit log.' });
  }
});

auditLogsRouter.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 500);
    const logs = await AuditLog.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json({ data: logs });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch audit logs.' });
  }
});

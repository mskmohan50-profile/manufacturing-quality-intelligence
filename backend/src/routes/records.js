import { Router } from 'express';
import mongoose from 'mongoose';
import { ProductionRecord } from '../models/ProductionRecord.js';
import { requireAuth } from '../middleware/auth.js';

export const recordsRouter = Router();
recordsRouter.use(requireAuth);

// The frontend (and the old Postgres columns) use snake_case field names.
// Convert an incoming snake_case payload into the camelCase shape Mongoose expects.
function fromSnakeCase(row) {
  return {
    machineId: row.machine_id,
    operator: row.operator,
    shift: row.shift,
    product: row.product,
    batch: row.batch,
    productionDate: row.production_date ? new Date(row.production_date) : undefined,
    cycleTimeSec: row.cycle_time_sec ?? 0,
    status: row.status ?? 'accepted',
    defectType: row.defect_type ?? null,
    temperature: row.temperature ?? null,
    pressure: row.pressure ?? null,
    vibration: row.vibration ?? null,
  };
}

// GET /api/records?limit=5000 — replaces:
// supabase.from('production_records').select('*').order('production_date', {ascending:false}).limit(5000)
recordsRouter.get('/', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 5000, 10000);
    const records = await ProductionRecord.find({ userId: req.user.id })
      .sort({ productionDate: -1 })
      .limit(limit);
    res.json({ data: records });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch records.' });
  }
});

// POST /api/records — replaces supabase.from('production_records').insert(validRecords)
// Accepts either a single record object or an array of records (bulk upload).
recordsRouter.post('/', async (req, res) => {
  try {
    const body = req.body;
    const rows = Array.isArray(body) ? body : [body];

    const docs = rows.map((row) => ({
      ...fromSnakeCase(row),
      userId: req.user.id,
    }));

    const created = await ProductionRecord.insertMany(docs);
    res.status(201).json({ data: created });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to insert records.' });
  }
});

// PATCH /api/records/:id — replaces supabase.from('production_records').update(...).eq('id', id)
recordsRouter.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ error: 'Invalid record id.' });
    }

    const updates = fromSnakeCase(req.body);
    Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

    const updated = await ProductionRecord.findOneAndUpdate(
      { _id: id, userId: req.user.id }, // ownership check, replaces RLS "auth.uid() = user_id"
      updates,
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Record not found.' });
    }

    res.json({ data: updated });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to update record.' });
  }
});

// DELETE /api/records  { ids: string[] } — replaces
// supabase.from('production_records').delete().in('id', ids)
recordsRouter.delete('/', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array.' });
    }

    const validIds = ids.filter((id) => mongoose.isValidObjectId(id));

    const result = await ProductionRecord.deleteMany({
      _id: { $in: validIds },
      userId: req.user.id, // ownership check, replaces RLS
    });

    res.json({ deletedCount: result.deletedCount });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Failed to delete records.' });
  }
});

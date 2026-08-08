import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: { type: String, required: true },
    entityType: { type: String, required: true, default: 'production_record' },
    entityId: { type: String, default: null },
    details: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

auditLogSchema.set('toJSON', {
  transform: (_doc, ret) => {
    return {
      id: ret._id.toString(),
      user_id: ret.userId?.toString?.() ?? ret.userId,
      action: ret.action,
      entity_type: ret.entityType,
      entity_id: ret.entityId,
      details: ret.details,
      created_at: ret.createdAt,
    };
  },
});

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

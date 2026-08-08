import mongoose from 'mongoose';

const productionRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    machineId: { type: String, required: true, index: true },
    operator: { type: String, required: true, index: true },
    shift: {
      type: String,
      required: true,
      enum: ['Morning', 'Afternoon', 'Night'],
      index: true,
    },
    product: { type: String, required: true },
    batch: { type: String, required: true },
    productionDate: { type: Date, required: true, index: true },
    cycleTimeSec: { type: Number, required: true, default: 0 },
    status: {
      type: String,
      required: true,
      enum: ['accepted', 'rejected'],
      default: 'accepted',
      index: true,
    },
    defectType: { type: String, default: null },
    temperature: { type: Number, default: null },
    pressure: { type: Number, default: null },
    vibration: { type: Number, default: null },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: false } }
);

productionRecordSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    return {
      id: ret._id.toString(),
      user_id: ret.userId?.toString?.() ?? ret.userId,
      machine_id: ret.machineId,
      operator: ret.operator,
      shift: ret.shift,
      product: ret.product,
      batch: ret.batch,
      production_date:
        ret.productionDate instanceof Date
          ? ret.productionDate.toISOString().slice(0, 10)
          : ret.productionDate,
      cycle_time_sec: ret.cycleTimeSec,
      status: ret.status,
      defect_type: ret.defectType,
      temperature: ret.temperature,
      pressure: ret.pressure,
      vibration: ret.vibration,
      created_at: ret.createdAt,
    };
  },
});

export const ProductionRecord = mongoose.model('ProductionRecord', productionRecordSchema);

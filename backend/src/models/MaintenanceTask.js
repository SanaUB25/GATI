import mongoose from 'mongoose';

const maintenanceTaskSchema = new mongoose.Schema({
  sourceId: { type: String, required: true, unique: true },
  sourceSystem: { type: String, enum: ['TMS', 'SMMS', 'TDMS'], required: true },
  department: { type: String, enum: ['ENGINEERING', 'SNT', 'TRD'], required: true, index: true },
  corridorId: { type: String, required: true, index: true },
  assetId: { type: String, required: true },
  defectType: { type: String, default: 'Inspection' }, urgency: { type: Number, min: 1, max: 5, default: 1 }, availabilityImpact: { type: Number, min: 0, max: 5, default: 1 },
  durationMin: { type: Number, min: 1, required: true },
  dueAt: { type: Date, required: true, index: true },
  severity: { type: Number, min: 1, max: 5, required: true },
  criticality: { type: Number, min: 1, max: 5, required: true },
  resources: { type: [String], default: [] },
  status: { type: String, enum: ['OPEN', 'SCHEDULED', 'COMPLETED', 'QUARANTINED'], default: 'OPEN', index: true },
  priorityScore: { type: Number, min: 0, max: 100 },
  priorityFactors: { type: mongoose.Schema.Types.Mixed, default: {} }
  ,sectionId: { type: String, index: true }, windowEarliestMin: Number, windowLatestMin: Number,
  weatherFactor: { type: Number, min: 0, default: 0 }, season: { type: String, enum: ['Monsoon', 'Summer', 'Winter', 'Other'], default: 'Other' },
  overdueDays: { type: Number, min: 0, default: 0 }, assetImportance: { type: Number, min: 1, max: 5, default: 1 }
}, { timestamps: true });

maintenanceTaskSchema.index({ corridorId: 1, status: 1, dueAt: 1 });
export const MaintenanceTask = mongoose.model('MaintenanceTask', maintenanceTaskSchema);

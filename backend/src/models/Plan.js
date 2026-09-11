import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  runId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanningRun', required: true, index: true },
  name: { type: String, required: true },
  status: { type: String, enum: ['DRAFT', 'RISKCLOCK_COMPLETE', 'BUNDLING_COMPLETE', 'CONFLICT_CHECKED', 'OPTIMIZED', 'SIMULATION_COMPLETE', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'EXECUTING', 'COMPLETED', 'REPAIRED'], default: 'DRAFT' },
  blocks: [{ windowId: String, taskIds: [String], start: Date, end: Date }],
  metrics: { meanDelay: Number, p95Delay: Number, cvar10: Number, cascadeProbability: Number, emergencyRate: Number, gati: Number },
  solver: { status: String, objective: Number, timeSeconds: Number },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date
}, { timestamps: true });
planSchema.index({ runId: 1, 'metrics.gati': 1 });
export const Plan = mongoose.model('Plan', planSchema);

import mongoose from 'mongoose';

const planSchema = new mongoose.Schema({
  runId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanningRun', required: true, index: true },
  name: { type: String, required: true },
  // CANDIDATE is retained to support plans persisted by the earlier UI.
  status: { type: String, enum: ['DRAFT', 'RISKCLOCK_COMPLETE', 'BUNDLING_COMPLETE', 'CONFLICT_CHECKED', 'OPTIMIZED', 'SIMULATION_COMPLETE', 'CANDIDATE', 'SELECTED', 'APPROVED', 'PUBLISHED', 'ARCHIVED', 'EXECUTING', 'COMPLETED', 'REPAIRED'], default: 'DRAFT' },
  blocks: [{ windowId: String, bundleId: String, sectionId: String, departments: [String], taskIds: [String], startMin: Number, endMin: Number, durationMin: Number, start: Date, end: Date }],
  metrics: { meanDelay: Number, p95Delay: Number, cvar10: Number, cascadeProbability: Number, emergencyRate: Number, gati: Number, coverage: Number, assetDowntimeMinutes: Number, freightPenalty: Number, maintenanceTime: Number },
  selection: { selectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, selectedAt: Date, comment: String }, weeklySchedule: [{ date: Date, blockId: String, sectionId: String, startMin: Number, endMin: Number, taskIds: [String], departments: [String] }], monthlySchedule: [{ date: Date, sectionId: String, taskIds: [String], status: String }],
  solver: { status: String, objective: Number, timeSeconds: Number, profile: Number, decisionVariables: Number, constraints: Number, weights: mongoose.Schema.Types.Mixed, objectiveDescription: String },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: Date
}, { timestamps: true });
planSchema.index({ runId: 1, 'metrics.gati': 1 });
export const Plan = mongoose.model('Plan', planSchema);

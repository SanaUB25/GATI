import mongoose from 'mongoose';

const planningRunSchema = new mongoose.Schema({
  corridorId: { type: String, required: true, index: true },
  horizon: { from: { type: Date, required: true }, to: { type: Date, required: true } },
  status: { type: String, enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED'], default: 'QUEUED', index: true },
  scenarioCount: { type: Number, min: 1, default: 1000 },
  configVersion: { type: String, required: true },
  inputSnapshotHash: { type: String },
  errorDetail: { type: String }
}, { timestamps: true });
planningRunSchema.index({ corridorId: 1, createdAt: -1 });
export const PlanningRun = mongoose.model('PlanningRun', planningRunSchema);

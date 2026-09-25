import mongoose from 'mongoose';

const planningRunSchema = new mongoose.Schema({
  corridorId: { type: String, required: true, index: true },
  horizon: { from: { type: Date, required: true }, to: { type: Date, required: true } },
  status: { type: String, enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'INFEASIBLE', 'FAILED', 'CANCELLED'], default: 'QUEUED', index: true },
  scenarioCount: { type: Number, min: 1, default: 1000 },
  parentRunId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanningRun', index: true },
  tradeoffWeights: { type: mongoose.Schema.Types.Mixed, default: {} },
  configVersion: { type: String, required: true },
  optimization: { type: mongoose.Schema.Types.Mixed },
  inputSnapshotHash: { type: String },
  errorDetail: { type: String }
}, { timestamps: true });
planningRunSchema.index({ corridorId: 1, createdAt: -1 });
export const PlanningRun = mongoose.model('PlanningRun', planningRunSchema);

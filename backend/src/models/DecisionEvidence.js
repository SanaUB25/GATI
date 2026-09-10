import mongoose from 'mongoose';

const simulationResultSchema = new mongoose.Schema({ planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true, unique: true, index: true }, runId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanningRun', required: true, index: true }, scenarioCount: { type: Number, required: true }, seed: { type: Number, required: true }, outcomes: { type: [Number], default: [] } }, { timestamps: true });
const riskReportSchema = new mongoose.Schema({ planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true, unique: true, index: true }, runId: { type: mongoose.Schema.Types.ObjectId, ref: 'PlanningRun', required: true, index: true }, meanDelay: Number, p95Delay: Number, cvar10: Number, cascadeProbability: Number, emergencyRate: Number, gati: Number, modelVersion: { type: String, default: 'v1' } }, { timestamps: true });
const approvalSchema = new mongoose.Schema({ planId: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan', required: true, index: true }, actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, status: { type: String, enum: ['CTO_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'], required: true }, comment: { type: String, maxlength: 1000, default: '' } }, { timestamps: true });
export const SimulationResult = mongoose.model('SimulationResult', simulationResultSchema);
export const RiskReport = mongoose.model('RiskReport', riskReportSchema);
export const Approval = mongoose.model('Approval', approvalSchema);

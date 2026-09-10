import mongoose from 'mongoose';
import { PlanningRun } from '../models/PlanningRun.js';
import { Plan } from '../models/Plan.js';
import { MaintenanceTask } from '../models/MaintenanceTask.js';
import { SimulationResult, RiskReport, Approval } from '../models/DecisionEvidence.js';
import { Notification, AuditLog } from '../models/OperationalModels.js';
import { aiRequest } from './aiEngineService.js';

const metricMap = (m = {}) => ({ meanDelay: m.mean_delay, p95Delay: m.p95_delay, cvar10: m.cvar10_delay, cascadeProbability: m.cascade_probability, emergencyRate: m.emergency_rate, gati: m.gati });
const lifecycle = { DRAFT: ['GENERATED'], GENERATED: ['SIMULATION_COMPLETE'], SIMULATION_COMPLETE: ['RISK_APPROVED'], RISK_APPROVED: ['CTO_REVIEW'], CTO_REVIEW: ['APPROVED'], APPROVED: ['PUBLISHED'], PUBLISHED: ['ARCHIVED'] };

export async function executeWorkflow(input, actorId, requestId) {
  const tasks = input.tasks?.length ? input.tasks : await MaintenanceTask.find({ corridorId: input.corridorId, status: { $in: ['OPEN', 'SCHEDULED'] } }).lean();
  if (!tasks.length) { const error = new Error('No eligible maintenance tasks found'); error.statusCode = 400; throw error; }
  if (!input.windows?.length) { const error = new Error('At least one possession window is required'); error.statusCode = 400; throw error; }
  const corridorId = input.corridorId || tasks[0].corridorId || 'default';
  const run = await PlanningRun.create({ corridorId, horizon: input.horizon || { from: new Date(), to: new Date(Date.now() + 7 * 86400000) }, status: 'RUNNING', scenarioCount: input.scenarioCount || 1000, configVersion: 'v1' });
  try {
    const aiTasks = tasks.map((task) => ({ id: String(task._id || task.id), duration_min: task.durationMin ?? task.duration_min, priority_score: task.priorityScore ?? task.priority_score ?? 0, criticality: task.criticality ?? 1, severity: task.severity ?? 1, overdue_days: task.overdueDays ?? 0, weather_risk: task.weatherRisk ?? 0, asset_importance: task.assetImportance ?? 1, corridor_id: task.corridorId ?? corridorId, resources: task.resources ?? [], resource: task.resource ?? 'track' }));
    const result = await aiRequest('/v1/workflow/run', { tasks: aiTasks, windows: input.windows, scenario_count: input.scenarioCount || 1000, seed: input.seed || 42, time_limit_seconds: input.timeLimitSeconds || 30 });
    if (!result.plans?.length) { const error = new Error('Optimizer found no feasible candidate plans'); error.statusCode = 422; throw error; }
    const persist = async (session) => {
      const options = session ? { session } : undefined;
      const plans = await Plan.insertMany(result.plans.map((candidate, index) => ({ runId: run._id, name: `Candidate ${index + 1}`, status: 'SIMULATION_COMPLETE', blocks: candidate.blocks.map((block) => ({ windowId: block.window_id, taskIds: block.task_ids })), metrics: metricMap(candidate.metrics), solver: { status: candidate.solver_status, objective: candidate.objective } })), options);
      await SimulationResult.insertMany(plans.map((plan, index) => ({ planId: plan._id, runId: run._id, scenarioCount: input.scenarioCount || 1000, seed: (input.seed || 42) + index, outcomes: result.plans[index].outcomes })), options);
      await RiskReport.insertMany(plans.map((plan, index) => ({ planId: plan._id, runId: run._id, ...metricMap(result.plans[index].metrics) })), options);
      await PlanningRun.updateOne({ _id: run._id }, { $set: { status: 'COMPLETED' } }, options);
      await Notification.create([{ userId: actorId, type: 'SIMULATION_COMPLETED', title: 'Planning simulation completed', message: `${plans.length} candidate plans are ready for risk review.` }], options);
      await AuditLog.create([{ actorId, action: 'WORKFLOW_EXECUTED', entityType: 'PlanningRun', entityId: String(run._id), requestId, metadata: { candidateCount: plans.length } }], options);
    };
    const session = await mongoose.startSession();
    try {
      try { await session.withTransaction(() => persist(session)); }
      catch (transactionError) {
        if (!/replica set|Transaction numbers are only allowed/i.test(transactionError.message)) throw transactionError;
        await persist(); // local standalone MongoDB has no transaction support; writes remain ordered and validated.
      }
    } finally { await session.endSession(); }
    return { run: await PlanningRun.findById(run._id).lean(), plans: await Plan.find({ runId: run._id }).sort({ 'metrics.gati': 1 }).lean(), bundles: result.bundles, conflicts: result.conflicts };
  } catch (error) { await PlanningRun.updateOne({ _id: run._id }, { $set: { status: 'FAILED', errorDetail: error.message } }); throw error; }
}

export async function transitionPlan(planId, status, actorId, comment, requestId) {
  const plan = await Plan.findById(planId);
  if (!plan) { const error = new Error('Plan not found'); error.statusCode = 404; throw error; }
  if (!lifecycle[plan.status]?.includes(status)) { const error = new Error(`Cannot transition plan from ${plan.status} to ${status}`); error.statusCode = 409; throw error; }
  plan.status = status; if (status === 'APPROVED') { plan.approvedBy = actorId; plan.approvedAt = new Date(); } await plan.save();
  await Approval.create({ planId, actorId, status, comment: comment || '' });
  await AuditLog.create({ actorId, action: `PLAN_${status}`, entityType: 'Plan', entityId: String(planId), requestId });
  await Notification.create({ userId: actorId, type: status === 'PUBLISHED' ? 'PLAN_PUBLISHED' : 'APPROVAL_REQUEST', title: `Plan ${status.toLowerCase().replace('_', ' ')}`, message: `Plan ${plan.name} is now ${status}.` });
  return plan.toObject();
}

export async function evidenceForPlan(planId) { return Promise.all([SimulationResult.findOne({ planId }).lean(), RiskReport.findOne({ planId }).lean(), Approval.find({ planId }).sort({ createdAt: -1 }).lean()]); }

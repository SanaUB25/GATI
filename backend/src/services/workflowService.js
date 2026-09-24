import mongoose from 'mongoose';
import { PlanningRun } from '../models/PlanningRun.js';
import { Plan } from '../models/Plan.js';
import { MaintenanceTask } from '../models/MaintenanceTask.js';
import { SimulationResult, RiskReport, Approval } from '../models/DecisionEvidence.js';
import { Notification, AuditLog } from '../models/OperationalModels.js';
import { aiRequest } from './aiEngineService.js';
import { getOperationalPlanningData, listScenarioDelays } from './operationalService.js';

const metricMap = (m = {}) => ({ meanDelay: m.mean_delay, p95Delay: m.p95_delay, cvar10: m.cvar10_delay, cascadeProbability: m.cascade_probability, emergencyRate: m.emergency_rate, gati: m.gati, coverage: m.coverage, assetDowntimeMinutes: m.asset_downtime_minutes, freightPenalty: m.freight_penalty });
// These are the only forward transitions for a railway plan.  The planner executes
// the first five automated stages together, so persisted candidates are ready at
// SIMULATION_COMPLETE for the human approval gate.
export const PLAN_WORKFLOW = Object.freeze({
  DRAFT: ['RISKCLOCK_COMPLETE'],
  RISKCLOCK_COMPLETE: ['BUNDLING_COMPLETE'],
  BUNDLING_COMPLETE: ['CONFLICT_CHECKED'],
  CONFLICT_CHECKED: ['OPTIMIZED'],
  OPTIMIZED: ['SIMULATION_COMPLETE'],
  SIMULATION_COMPLETE: ['APPROVED'],
  // Existing plans from earlier candidate/selection UI versions can still be approved.
  CANDIDATE: ['APPROVED'],
  SELECTED: ['APPROVED'],
  APPROVED: ['PUBLISHED'],
  PUBLISHED: ['ARCHIVED']
});

async function validateApproval(plan) {
  const hasScheduledWork = plan.blocks?.some((block) => block.taskIds?.length);
  const hasGatiScore = Number.isFinite(plan.metrics?.gati);
  const [simulation, riskReport] = await Promise.all([
    SimulationResult.exists({ planId: plan._id }),
    RiskReport.exists({ planId: plan._id })
  ]);

  if (!hasScheduledWork || !hasGatiScore || !simulation || !riskReport) {
    const error = new Error('Plan cannot be approved until its scheduled work, simulation result, and risk assessment are complete');
    error.statusCode = 422;
    throw error;
  }
}

export async function executeWorkflow(input, actorId, requestId) {
  const tasks = input.tasks?.length ? input.tasks : await MaintenanceTask.find({ corridorId: input.corridorId, status: { $in: ['OPEN', 'SCHEDULED'] } }).lean();
  if (!tasks.length) { const error = new Error('No eligible maintenance tasks found'); error.statusCode = 400; throw error; }
  const corridorId = input.corridorId || tasks[0].corridorId || 'default';
  const run = await PlanningRun.create({ corridorId, horizon: input.horizon || { from: new Date(), to: new Date(Date.now() + 7 * 86400000) }, status: 'RUNNING', scenarioCount: input.scenarioCount || 1000, configVersion: 'v1' });
  try {
    const aiTasks = tasks.map((task) => ({ id: String(task._id || task.id), duration_min: task.durationMin ?? task.duration_min, priority_score: task.priorityScore ?? task.priority_score ?? 0, criticality: task.criticality ?? 1, severity: task.severity ?? 1, urgency: task.urgency ?? task.criticality ?? 1, availability_impact: task.availabilityImpact ?? 1, overdue_days: task.overdueDays ?? 0, weather_risk: task.weatherFactor ?? task.weatherRisk ?? 0, season: task.season ?? 'Other', asset_importance: task.assetImportance ?? 1, section_id: task.sectionId ?? task.assetId, earliest_start: task.windowEarliestMin ?? 0, latest_end: task.windowLatestMin ?? 1440, corridor_id: task.corridorId ?? corridorId, resources: task.resources ?? [], resource: task.resource ?? 'track', department: task.department }));
    const [scenarioDelays, operationalData] = await Promise.all([listScenarioDelays(input.scenarioCount || 1000), getOperationalPlanningData(corridorId)]);
    if (!operationalData.windows.length) { const error = new Error('No persisted COA availability records loaded for corridor'); error.statusCode = 422; throw error; }
    const result = await aiRequest('/v1/workflow/run', { tasks: aiTasks, scenario_count: input.scenarioCount || 1000, seed: input.seed || 42, time_limit_seconds: input.timeLimitSeconds || 30, scenario_delays: scenarioDelays, tradeoff_weights: input.tradeoffWeights || {}, ...operationalData });
    if (!result.plans?.length) { const error = new Error('Optimizer found no feasible candidate plans'); error.statusCode = 422; throw error; }
    await MaintenanceTask.bulkWrite(result.tasks.map((task) => ({ updateOne: { filter: { _id: task.id }, update: { $set: { priorityScore: task.priority_score, priorityFactors: task.priority_factors } } } })));
    const persist = async (session) => {
      const options = session ? { session } : undefined;
      const plans = await Plan.insertMany(result.plans.map((candidate, index) => ({ runId: run._id, name: `Candidate ${index + 1}`, status: 'SIMULATION_COMPLETE', blocks: candidate.blocks.map((block) => ({ windowId: block.window_id, bundleId: block.bundle_id, sectionId: block.section_id, departments: block.departments, taskIds: block.task_ids, startMin: block.start_min, endMin: block.end_min, durationMin: block.duration_min })), metrics: metricMap(candidate.metrics), solver: { status: candidate.solver_status, objective: candidate.objective } })), options);
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
  if (!PLAN_WORKFLOW[plan.status]?.includes(status)) { const error = new Error(`Cannot transition plan from ${plan.status} to ${status}`); error.statusCode = 409; throw error; }
  if (status === 'APPROVED') await validateApproval(plan);
  plan.status = status;
  if (status === 'APPROVED') {
    plan.approvedBy = actorId; plan.approvedAt = new Date(); plan.selection = { selectedBy: actorId, selectedAt: new Date(), comment: comment || '' };
    const date = new Date('2026-10-01T00:00:00Z');
    plan.weeklySchedule = plan.blocks.map((block, index) => ({ date: new Date(date.getTime() + (index % 7) * 86400000), blockId: block.bundleId || block.windowId, sectionId: block.sectionId, startMin: block.startMin, endMin: block.endMin, taskIds: block.taskIds, departments: block.departments }));
    plan.monthlySchedule = plan.weeklySchedule.map(item => ({ date: item.date, sectionId: item.sectionId, taskIds: item.taskIds, status: 'SCHEDULED' }));
  }
  await plan.save();
  await Approval.create({ planId, actorId, status, comment: comment || '' });
  await AuditLog.create({ actorId, action: `PLAN_${status}`, entityType: 'Plan', entityId: String(planId), requestId });
  await Notification.create({ userId: actorId, type: status === 'PUBLISHED' ? 'PLAN_PUBLISHED' : 'APPROVAL_REQUEST', title: `Plan ${status.toLowerCase().replace('_', ' ')}`, message: `Plan ${plan.name} is now ${status}.` });
  return plan.toObject();
}

export async function schedulesForPlan(planId) {
  const plan = await Plan.findById(planId).select('status weeklySchedule monthlySchedule name').lean();
  if (!plan) { const error = new Error('Plan not found'); error.statusCode = 404; throw error; }
  return { planId, status: plan.status, weekly: plan.weeklySchedule || [], monthly: plan.monthlySchedule || [] };
}

export async function evidenceForPlan(planId) { return Promise.all([SimulationResult.findOne({ planId }).lean(), RiskReport.findOne({ planId }).lean(), Approval.find({ planId }).sort({ createdAt: -1 }).lean()]); }

export async function repairPlanForEmergency(planId, emergencyTask, actorId, requestId) {
  const original = await Plan.findById(planId).lean();
  if (!original) { const error = new Error('Plan not found'); error.statusCode = 404; throw error; }
  const task = emergencyTask.sourceId ? emergencyTask : await MaintenanceTask.findById(emergencyTask.taskId).lean();
  if (!task) { const error = new Error('Emergency maintenance task not found'); error.statusCode = 404; throw error; }
  const decorated = { ...original, id: String(original._id), blocks: original.blocks.map((block) => ({ ...block, task_ids: block.taskIds, approved: original.status === 'APPROVED' || original.status === 'PUBLISHED' })) };
  const emergency = { id: String(task._id), section_id: task.sectionId, duration_min: task.durationMin, window_id: emergencyTask.windowId };
  const repaired = await aiRequest('/v1/plans/repair', { plan: decorated, disruption: { type: 'EMERGENCY_MAINTENANCE', emergency_task: emergency, affected_task_ids: emergencyTask.affectedTaskIds || [], estimated_delay_delta: emergencyTask.estimatedDelayDelta ?? task.durationMin } });
  const originalMetrics = original.metrics || {};
  const meanDelay = repaired.metrics.mean_delay;
  const cvar10 = Number(originalMetrics.cvar10 || meanDelay) + (meanDelay - Number(originalMetrics.meanDelay || 0));
  const score = await aiRequest('/v1/gati', { mean_delay: meanDelay, cvar10_delay: cvar10 });
  const newPlan = await Plan.create({ runId: original.runId, name: `${original.name} — Emergency repair`, status: 'REPAIRED', blocks: repaired.blocks.map((block) => ({ windowId: block.window_id || block.windowId, taskIds: block.task_ids || block.taskIds || [] })), metrics: { ...originalMetrics, meanDelay, cvar10, gati: score.gati }, solver: { ...original.solver, status: 'REPAIRED_REMAINING_WORK' } });
  await RiskReport.create({ planId: newPlan._id, runId: newPlan.runId, ...newPlan.metrics, modelVersion: 'repair-v1' });
  await AuditLog.create({ actorId, action: 'PLAN_REPAIRED_FOR_EMERGENCY', entityType: 'Plan', entityId: String(newPlan._id), requestId, metadata: { originalPlanId: String(original._id), emergencyTaskId: String(task._id) } });
  return { originalPlan: original, repairedPlan: newPlan.toObject(), repair: { ...repaired, metrics: { ...repaired.metrics, gati: score.gati } } };
}

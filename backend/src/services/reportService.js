import { MaintenanceTask } from '../models/MaintenanceTask.js';
import { Plan } from '../models/Plan.js';
import { PlanningRun } from '../models/PlanningRun.js';
import { Approval, RiskReport, SimulationResult } from '../models/DecisionEvidence.js';

const REPORT_TYPES = new Set(['daily', 'weekly', 'monthly', 'risk', 'maintenance', 'simulation', 'executive']);
const departmentLabel = { ENGINEERING: 'Engineering', SNT: 'S&T', TRD: 'TRD' };

function reportWindow(type, now) {
  if (!['daily', 'weekly', 'monthly'].includes(type)) return null;
  const from = new Date(now);
  if (type === 'daily') from.setHours(0, 0, 0, 0);
  if (type === 'weekly') from.setDate(from.getDate() - 7);
  if (type === 'monthly') from.setMonth(from.getMonth() - 1);
  return { from, to: now };
}

const value = (input) => input == null || input === '' ? '—' : String(input);
const row = (label, data) => [label, value(data)];
const csv = (rows) => rows.map((columns) => columns.map((column) => `"${String(column).replaceAll('"', '""')}"`).join(',')).join('\n');

export async function generateCsvReport(type = 'maintenance', corridorId) {
  const normalizedType = String(type).toLowerCase();
  if (!REPORT_TYPES.has(normalizedType)) {
    const error = new Error('Unsupported report type'); error.statusCode = 400; throw error;
  }

  const generatedAt = new Date();
  const window = reportWindow(normalizedType, generatedAt);
  const taskFilter = { ...(corridorId ? { corridorId } : {}), ...(window ? { dueAt: { $gte: window.from, $lte: window.to } } : {}) };
  const planFilter = window ? { createdAt: { $gte: window.from, $lte: window.to } } : {};
  const [tasks, plans, runs] = await Promise.all([
    MaintenanceTask.find(taskFilter).sort({ priorityScore: -1, dueAt: 1 }).lean(),
    Plan.find(planFilter).sort({ 'metrics.gati': 1, createdAt: -1 }).lean(),
    PlanningRun.find().select('_id corridorId').lean()
  ]);
  const planIds = plans.map((plan) => plan._id);
  const [riskReports, simulations, approvals] = await Promise.all([
    RiskReport.find({ planId: { $in: planIds } }).lean(),
    SimulationResult.find({ planId: { $in: planIds } }).lean(),
    Approval.find({ planId: { $in: planIds } }).sort({ createdAt: -1 }).lean()
  ]);
  const runCorridors = new Map(runs.map((run) => [String(run._id), run.corridorId]));
  const resolvedCorridor = corridorId || tasks[0]?.corridorId || runCorridors.get(String(plans[0]?.runId)) || 'No corridor data available';
  const selectedPlan = plans.find((plan) => ['APPROVED', 'PUBLISHED'].includes(plan.status)) || plans[0];
  const selectedApproval = approvals.find((approval) => String(approval.planId) === String(selectedPlan?._id) && approval.status === 'APPROVED');
  const riskByPlan = new Map(riskReports.map((risk) => [String(risk.planId), risk]));
  const selectedRisk = riskByPlan.get(String(selectedPlan?._id));
  const departmentRows = ['ENGINEERING', 'SNT', 'TRD'].map((department) => {
    const departmentTasks = tasks.filter((task) => task.department === department);
    return [departmentLabel[department], departmentTasks.length, departmentTasks.filter((task) => task.status === 'OPEN').length, departmentTasks.filter((task) => task.severity >= 4).length];
  });
  const criticalTasks = tasks.filter((task) => task.severity >= 4);
  const blockCount = plans.reduce((count, plan) => count + (plan.blocks?.length || 0), 0);
  const scheduledTaskCount = plans.reduce((count, plan) => count + (plan.blocks || []).reduce((total, block) => total + (block.taskIds?.length || 0), 0), 0);
  const rows = [
    ['RAILVISTA OPERATIONAL REPORT'],
    row('Report type', normalizedType.toUpperCase()),
    row('Generated at', generatedAt.toISOString()),
    row('Corridor', resolvedCorridor),
    row('Period', window ? `${window.from.toISOString()} to ${window.to.toISOString()}` : 'Current operational snapshot'),
    []
  ];

  if (!tasks.length && !plans.length) {
    rows.push(['No operational data available.']);
    return {
      filename: `railvista-${normalizedType}-report.csv`,
      content: csv(rows),
      data: { type: normalizedType, generatedAt: generatedAt.toISOString(), corridor: resolvedCorridor, period: window ? { from: window.from, to: window.to } : null, message: 'No operational data available.' }
    };
  }

  rows.push(
    ['MAINTENANCE SUMMARY'],
    ['Total maintenance items', tasks.length],
    ['Open maintenance items', tasks.filter((task) => task.status === 'OPEN').length],
    ['Scheduled maintenance items', tasks.filter((task) => task.status === 'SCHEDULED').length],
    [], ['DEPARTMENT STATISTICS'], ['Department', 'Total', 'Open', 'Critical'], ...departmentRows,
    [], ['RISKCLOCK SUMMARY'],
    ['Critical alerts (severity 4-5)', criticalTasks.length],
    ['Highest priority score', tasks[0]?.priorityScore ?? '—'],
    [], ['PRIORITY RANKING'], ['Rank', 'Asset', 'Department', 'Priority score', 'Severity', 'Due date'],
    ...tasks.slice(0, 10).map((task, index) => [index + 1, task.assetId, departmentLabel[task.department] || task.department, task.priorityScore ?? '—', task.severity, task.dueAt?.toISOString?.() || '—']),
    [], ['BUNDLED MAINTENANCE BLOCKS'],
    ['Total blocks', blockCount], ['Scheduled tasks across blocks', scheduledTaskCount],
    ...plans.flatMap((plan) => (plan.blocks || []).map((block, index) => [plan.name, `Block ${index + 1}`, block.windowId || '—', block.taskIds?.length || 0])),
    [], ['CONFLICT SHIELD SUMMARY'],
    ['Candidate plans evaluated', plans.length], ['Validated planned blocks', blockCount],
    ['Conflict detail', 'No persisted conflict exceptions for this report snapshot'],
    [], ['CANDIDATE PLANS'], ['Plan', 'Status', 'GATI', 'Mean delay', 'CVaR10', 'Blocks'],
    ...plans.map((plan) => [plan.name, plan.status, plan.metrics?.gati ?? riskByPlan.get(String(plan._id))?.gati ?? '—', plan.metrics?.meanDelay ?? '—', plan.metrics?.cvar10 ?? '—', plan.blocks?.length || 0]),
    [], ['SIMULATION SUMMARY'], ['Simulation result records', simulations.length], ['Scenarios evaluated', simulations.reduce((total, simulation) => total + (simulation.scenarioCount || 0), 0)],
    [], ['FINAL RECOMMENDATION'],
    ['Selected final plan', selectedPlan?.name || 'No candidate plan available'],
    ['GATI score', selectedPlan?.metrics?.gati ?? selectedRisk?.gati ?? '—'],
    ['AI recommendation', selectedPlan ? `Recommend ${selectedPlan.name}: lowest available GATI score in this snapshot.` : 'No recommendation available until candidate plans are generated.'],
    ['CTO approval status', selectedPlan?.status === 'APPROVED' || selectedPlan?.status === 'PUBLISHED' ? selectedPlan.status : 'Pending'],
    ['Approved by', selectedPlan?.approvedBy || selectedApproval?.actorId || '—'],
    ['Approved at', selectedPlan?.approvedAt?.toISOString?.() || selectedApproval?.createdAt?.toISOString?.() || '—']
  );
  return {
    filename: `railvista-${normalizedType}-report.csv`,
    content: csv(rows),
    data: {
      type: normalizedType,
      generatedAt: generatedAt.toISOString(),
      corridor: resolvedCorridor,
      period: window ? { from: window.from, to: window.to } : null,
      maintenanceSummary: { total: tasks.length, open: tasks.filter((task) => task.status === 'OPEN').length, scheduled: tasks.filter((task) => task.status === 'SCHEDULED').length },
      departmentStatistics: departmentRows.map(([department, total, open, critical]) => ({ department, total, open, critical })),
      riskClock: { criticalAlerts: criticalTasks.length, highestPriorityScore: tasks[0]?.priorityScore ?? null },
      priorityRanking: tasks.slice(0, 10).map((task, index) => ({ rank: index + 1, assetId: task.assetId, department: departmentLabel[task.department] || task.department, priorityScore: task.priorityScore ?? null, severity: task.severity, dueAt: task.dueAt })),
      bundledMaintenance: { blockCount, scheduledTaskCount },
      conflictShield: { candidatePlans: plans.length, validatedBlocks: blockCount, detail: 'No persisted conflict exceptions for this report snapshot' },
      candidatePlans: plans.map((plan) => ({ id: String(plan._id), name: plan.name, status: plan.status, gati: plan.metrics?.gati ?? riskByPlan.get(String(plan._id))?.gati ?? null, meanDelay: plan.metrics?.meanDelay ?? null, cvar10: plan.metrics?.cvar10 ?? null, blockCount: plan.blocks?.length || 0 })),
      simulationSummary: { resultRecords: simulations.length, scenariosEvaluated: simulations.reduce((total, simulation) => total + (simulation.scenarioCount || 0), 0) },
      finalRecommendation: { plan: selectedPlan?.name || null, gati: selectedPlan?.metrics?.gati ?? selectedRisk?.gati ?? null, recommendation: selectedPlan ? `Recommend ${selectedPlan.name}: lowest available GATI score in this snapshot.` : 'No recommendation available until candidate plans are generated.', ctoApprovalStatus: selectedPlan?.status === 'APPROVED' || selectedPlan?.status === 'PUBLISHED' ? selectedPlan.status : 'Pending', approvedBy: selectedPlan?.approvedBy || selectedApproval?.actorId || null, approvedAt: selectedPlan?.approvedAt || selectedApproval?.createdAt || null }
    }
  };
}

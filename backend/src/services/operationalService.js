import { MaintenanceTask } from '../models/MaintenanceTask.js';
import { Plan } from '../models/Plan.js';
import { Notification, AuditLog, Department, Role } from '../models/OperationalModels.js';
import { DatasetImport, Network, Scenario, Station, Train } from '../models/RailwayData.js';

const page = (value) => Math.max(1, Number(value) || 1);
const limit = (value) => Math.min(100, Math.max(1, Number(value) || 20));
export async function listTasks(query) { const currentPage = page(query.page); const currentLimit = limit(query.limit); const filter = {}; if (query.corridorId) filter.corridorId = query.corridorId; if (query.department) filter.department = query.department; if (query.status) filter.status = query.status; const [items, total] = await Promise.all([MaintenanceTask.find(filter).sort({ dueAt: 1 }).skip((currentPage - 1) * currentLimit).limit(currentLimit).lean(), MaintenanceTask.countDocuments(filter)]); return { items, page: currentPage, limit: currentLimit, total, pages: Math.ceil(total / currentLimit) }; }
export async function listPlans(runId, query) { const currentPage = page(query.page); const currentLimit = limit(query.limit); const filter = { runId }; const [items, total] = await Promise.all([Plan.find(filter).sort({ 'metrics.gati': 1 }).skip((currentPage - 1) * currentLimit).limit(currentLimit).lean(), Plan.countDocuments(filter)]); return { items, page: currentPage, limit: currentLimit, total }; }
export async function getPlan(id) { return Plan.findById(id).lean(); }
export async function createPlan(input) { return Plan.create({ runId: input.runId, name: input.name, blocks: input.blocks || [], metrics: input.metrics || {}, status: 'DRAFT' }); }
export async function updatePlan(id, input) { return Plan.findOneAndUpdate({ _id: id, status: { $in: ['DRAFT', 'REVIEW', 'REPAIRED'] } }, { $set: { name: input.name, blocks: input.blocks, metrics: input.metrics } }, { new: true, runValidators: true }).lean(); }
export async function deletePlan(id) { return Plan.findOneAndDelete({ _id: id, status: 'DRAFT' }).lean(); }
export async function changePlanStatus(id, status, userId) { return Plan.findByIdAndUpdate(id, { $set: { status, ...(status === 'APPROVED' ? { approvedBy: userId, approvedAt: new Date() } : {}) } }, { new: true }).lean(); }
export async function listNotifications(userId, query) { return Notification.find({ userId, ...(query.unread === 'true' ? { readAt: null } : {}) }).sort({ createdAt: -1 }).limit(100).lean(); }
export async function markNotificationRead(id, userId) { return Notification.findOneAndUpdate({ _id: id, userId }, { $set: { readAt: new Date() } }, { new: true }).lean(); }
export async function listAdminData(type) { if (type === 'users') return (await import('../models/User.js')).User.find().select('-passwordHash').lean(); if (type === 'departments') return Department.find().lean(); if (type === 'roles') return Role.find().lean(); if (type === 'dataset-status') { const [maintenance, network, stations, trains, scenarios, latest] = await Promise.all([MaintenanceTask.countDocuments(), Network.countDocuments(), Station.countDocuments(), Train.countDocuments(), Scenario.countDocuments(), DatasetImport.findOne().sort({ createdAt: -1 }).lean()]); return { maintenance, network, stations, trains, scenarios, lastImportAt: latest?.createdAt || null, seedStatus: latest?.status || 'NOT_RUN' }; } return []; }
export async function listScenarioDelays(count = 1000) { const records = await Scenario.find().sort({ scenarioId: 1 }).limit(Math.min(10000, Math.max(1, Number(count) || 1000))).lean(); return records.map((scenario) => ({ train_delay: scenario.trainDelay, maintenance_overrun: scenario.maintenanceOverrun, traffic_factor: scenario.trafficFactor, asset_risk: scenario.assetRisk })); }
export async function listAudit(query) { return AuditLog.find({ ...(query.entityType ? { entityType: query.entityType } : {}) }).sort({ createdAt: -1 }).limit(100).lean(); }
export async function getWorkflowOverview(query) {
  const corridorId = query.corridorId || 'NDLS-KKDE';
  const taskFilter = { corridorId };
  const [tasks, plans, activeBlocks, stations, trackSections] = await Promise.all([
    MaintenanceTask.find(taskFilter).sort({ dueAt: 1 }).lean(),
    Plan.find().sort({ createdAt: -1 }).limit(3).lean(),
    Plan.countDocuments({ status: { $in: ['APPROVED', 'PUBLISHED', 'EXECUTING'] } }), Station.countDocuments(), Network.countDocuments()
  ]);
  const byDepartment = ['ENGINEERING', 'SNT', 'TRD'].map((department) => ({ department, tasks: tasks.filter((task) => task.department === department).length }));
  const critical = tasks.filter((task) => task.severity >= 4 && task.status !== 'COMPLETED');
  const recommended = plans.slice().sort((left, right) => (left.metrics?.gati ?? Infinity) - (right.metrics?.gati ?? Infinity))[0] || null;
  return {
    corridorId, stations, trackSections, assets: new Set(tasks.map((task) => task.assetId)).size,
    activeMaintenance: tasks.filter((task) => task.status === 'OPEN' || task.status === 'SCHEDULED').length,
    activeBlocks, criticalAlerts: critical.length, departments: byDepartment, tasks, plans,
    recommendedPlanId: recommended?._id?.toString() || null,
    stages: {
      maintenance: tasks.length ? 'COMPLETED' : 'PENDING', priority: tasks.some((task) => task.priorityScore != null) ? 'COMPLETED' : 'PENDING',
      planning: plans.length ? 'COMPLETED' : 'PENDING', approval: plans.some((plan) => plan.status === 'APPROVED' || plan.status === 'PUBLISHED') ? 'COMPLETED' : 'PENDING',
      publish: plans.some((plan) => plan.status === 'PUBLISHED') ? 'COMPLETED' : 'PENDING'
    }
  };
}

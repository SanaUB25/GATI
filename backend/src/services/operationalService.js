import { MaintenanceTask } from '../models/MaintenanceTask.js';
import { Plan } from '../models/Plan.js';
import { PlanningRun } from '../models/PlanningRun.js';
import { Notification, AuditLog, Department, Role } from '../models/OperationalModels.js';
import { Asset, CorridorAvailability, DatasetImport, DepartmentResource, GoodsForecast, Network, Scenario, Station, Train } from '../models/RailwayData.js';
import { aiRequest } from './aiEngineService.js';

const page = (value) => Math.max(1, Number(value) || 1);
const limit = (value) => Math.min(100, Math.max(1, Number(value) || 20));
// Mirrors the AI engine WorkflowRequest default and optimizer fallback.
const TRAIN_SAFETY_MARGIN_MIN = 10;
function trainOccupiesSection(train, sectionId, startMin, endMin, safetyMarginMin = TRAIN_SAFETY_MARGIN_MIN) {
  const route = train.route || []; const index = route.indexOf(sectionId);
  if (index < 0) return false;
  const span = Math.max(1, train.arrivalMin - train.departureMin); const count = Math.max(1, route.length);
  const sectionStart = train.departureMin + index * span / count;
  const sectionEnd = train.departureMin + (index + 1) * span / count;
  return Math.max(startMin - safetyMarginMin, sectionStart) < Math.min(endMin + safetyMarginMin, sectionEnd);
}
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
export async function listScenarioDelays(count = 1000) { const records = await Scenario.find().sort({ scenarioId: 1 }).limit(Math.min(10000, Math.max(1, Number(count) || 1000))).lean(); return records.map((scenario) => ({ train_delay: scenario.trainDelay, maintenance_overrun: scenario.maintenanceOverrun, traffic_factor: scenario.trafficFactor, asset_risk: scenario.assetRisk, failure_probability: scenario.failureProbability, emergency_event: scenario.emergencyEvent })); }
export async function getOperationalPlanningData(corridorId = 'NDLS-KKDE') { const [network, trains, coa, goods, assets, resources] = await Promise.all([Network.find().lean(), Train.find().lean(), CorridorAvailability.find({ corridorId }).lean(), GoodsForecast.find().lean(), Asset.find().lean(), DepartmentResource.find().lean()]); return { network: network.map((section) => ({ section_id: section.sectionId, capacity: section.capacity, single_line: section.singleLine })), trains: trains.map((train) => ({ id: train.trainId, route: train.route, departure: train.departureMin, arrival: train.arrivalMin, priority: train.priority })), windows: coa.map(x => ({ id: x.coaId, section_id: x.sectionId, start_min: x.startMin, end_min: x.endMin, availability_status: x.availabilityStatus, allowed_departments: x.allowedDepartments })), goods_forecasts: goods.map(x => ({ section_id: x.sectionId, start_min: x.startMin, end_min: x.endMin, capacity_demand: x.capacityDemand })), assets: assets.map(x => ({ asset_id: x.assetId, section_id: x.sectionId, current_availability: x.currentAvailability, failure_impact: x.failureImpact })), resource_capacities: Object.fromEntries(resources.map(x => [x.department, x.capacity])) }; }
export async function getCoaWorkspace(query) {
  const corridorId = query.corridorId || 'NDLS-KKDE';
  const [windows, tasks, trains] = await Promise.all([
    CorridorAvailability.find({ corridorId }).sort({ date: 1, startMin: 1 }).lean(),
    MaintenanceTask.find({ corridorId, status: { $in: ['OPEN', 'SCHEDULED'] } }).lean(),
    Train.find().lean()
  ]);
  const overlaps = (start, end, train, sectionId) => trainOccupiesSection(train, sectionId, start, end);
  const decorated = windows.map((window) => {
    const durationMin = window.endMin - window.startMin;
    const trainConflict = trains.some((train) => overlaps(window.startMin, window.endMin, train, window.sectionId));
    const eligibleTasks = window.availabilityStatus === 'BLOCKED' ? [] : tasks
      .filter((task) => task.sectionId === window.sectionId
        && task.durationMin <= durationMin
        && window.startMin >= (task.windowEarliestMin ?? 0)
        && window.endMin <= (task.windowLatestMin ?? 1440)
        && (window.allowedDepartments || []).includes(task.department))
      .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0))
      .map((task) => ({ id: String(task._id), sourceId: task.sourceId, sourceSystem: task.sourceSystem, department: task.department, sectionId: task.sectionId, priorityScore: task.priorityScore ?? null, riskClock: task.priorityScore ?? null, durationMin: task.durationMin, defectType: task.defectType }));
    return { id: window.coaId, sectionId: window.sectionId, date: window.date, startMin: window.startMin, endMin: window.endMin, durationMin, status: window.availabilityStatus, capacity: window.capacity, possessionType: window.possessionType, allowedDepartments: window.allowedDepartments, eligibleTasks, operationalCheck: trainConflict ? 'TRAIN CONFLICT' : 'NO TRAIN CONFLICT' };
  });
  const byStatus = (status) => decorated.filter((window) => window.status === status);
  const usable = decorated.filter((window) => window.status !== 'BLOCKED');
  const sectionAvailability = Object.values(usable.reduce((all, window) => {
    const item = all[window.sectionId] || { sectionId: window.sectionId, possessionMin: 0, availableWindows: 0 };
    item.possessionMin += window.durationMin; item.availableWindows += 1; all[window.sectionId] = item; return all;
  }, {})).sort((a, b) => b.possessionMin - a.possessionMin);
  return { corridorId, summary: { totalWindows: decorated.length, availableWindows: byStatus('AVAILABLE').length, restrictedBlockedWindows: decorated.filter((window) => window.status === 'RESTRICTED' || window.status === 'BLOCKED').length, totalPossessionMin: usable.reduce((total, window) => total + window.durationMin, 0) }, sectionAvailability, windows: decorated };
}
export async function getTimetableWorkspace(query) {
  const corridorId = query.corridorId || 'NDLS-KKDE';
  const [trains, windows, tasks] = await Promise.all([
    Train.find().sort({ departureMin: 1, trainId: 1 }).lean(),
    CorridorAvailability.find({ corridorId }).sort({ date: 1, startMin: 1 }).lean(),
    MaintenanceTask.find({ corridorId, status: { $in: ['OPEN', 'SCHEDULED'] } }).lean()
  ]);
  const intersectsProtectedInterval = (window, train) => trainOccupiesSection(train, window.sectionId, window.startMin, window.endMin);
  const traffic = Object.values(trains.reduce((all, train) => {
    train.route.forEach((sectionId) => { all[sectionId] = { sectionId, movements: (all[sectionId]?.movements || 0) + 1 }; }); return all;
  }, {})).sort((a, b) => b.movements - a.movements || a.sectionId.localeCompare(b.sectionId));
  const coaChecks = windows.map((window) => {
    const matchingTrains = trains.filter((train) => intersectsProtectedInterval(window, train));
    const eligibleTasks = window.availabilityStatus === 'BLOCKED' ? [] : tasks.filter((task) => task.sectionId === window.sectionId
      && task.durationMin <= window.endMin - window.startMin
      && window.startMin >= (task.windowEarliestMin ?? 0)
      && window.endMin <= (task.windowLatestMin ?? 1440)
      && (window.allowedDepartments || []).includes(task.department)).map((task) => ({ sourceId: task.sourceId, department: task.department }));
    return { id: window.coaId, sectionId: window.sectionId, date: window.date, startMin: window.startMin, endMin: window.endMin, coaStatus: window.availabilityStatus, result: matchingTrains.length ? 'TRAIN CONFLICT' : 'SAFE', safetyMarginMin: TRAIN_SAFETY_MARGIN_MIN, trains: matchingTrains.map((train) => ({ id: train.trainId, route: train.route, departureMin: train.departureMin, arrivalMin: train.arrivalMin, priority: train.priority })), eligibleTasks };
  });
  return { corridorId, safetyMarginMin: TRAIN_SAFETY_MARGIN_MIN, summary: { timetableRecords: trains.length, sectionsCovered: traffic.length, protectedMovements: trains.filter((train) => train.priority === 'high').length, coaConflicts: coaChecks.filter((check) => check.result === 'TRAIN CONFLICT').length }, trains: trains.map((train) => ({ id: train.trainId, route: train.route, departureMin: train.departureMin, arrivalMin: train.arrivalMin, durationMin: train.arrivalMin - train.departureMin, priority: train.priority, rakeId: train.rakeId })), sectionTraffic: traffic, coaChecks };
}
export async function getBundlerWorkspace(query) {
  const corridorId = query.corridorId || 'NDLS-KKDE';
  const [tasks, windows, trains] = await Promise.all([
    MaintenanceTask.find({ corridorId, status: { $in: ['OPEN', 'SCHEDULED'] } }).lean(),
    CorridorAvailability.find({ corridorId }).sort({ date: 1, startMin: 1 }).lean(),
    Train.find().lean()
  ]);
  const aiTasks = tasks.map((task) => ({ id: String(task._id), section_id: task.sectionId || task.assetId, department: task.department, resources: task.resources || [task.department], duration_min: task.durationMin, earliest_start: task.windowEarliestMin ?? 0, latest_end: task.windowLatestMin ?? 1440 }));
  const result = await aiRequest('/v1/bundler', { tasks: aiTasks });
  const taskById = Object.fromEntries(tasks.map((task) => [String(task._id), task]));
  const hasTrainConflict = (window) => trains.some((train) => trainOccupiesSection(train, window.sectionId, window.startMin, window.endMin));
  const bundles = (result.bundles || []).filter((bundle) => bundle.tasks_combined > 1).map((bundle) => {
    const members = bundle.task_ids.map((id) => taskById[id]).filter(Boolean);
    const fits = windows.filter((window) => window.availabilityStatus !== 'BLOCKED' && window.sectionId === bundle.section_id
      && window.endMin - window.startMin >= bundle.after_block_minutes
      && window.startMin >= bundle.window.start_min && window.endMin <= bundle.window.end_min
      && members.every((task) => (window.allowedDepartments || []).includes(task.department)));
    const candidateWindows = fits.map((window) => ({ id: window.coaId, date: window.date, startMin: window.startMin, endMin: window.endMin, durationMin: window.endMin - window.startMin, status: window.availabilityStatus, trainFeasibility: hasTrainConflict(window) ? 'TRAIN CONFLICT' : 'TRAIN SAFE' }));
    const safe = candidateWindows.find((window) => window.trainFeasibility === 'TRAIN SAFE');
    const selectedWindow = safe || candidateWindows[0] || null;
    const operationalStatus = !selectedWindow ? 'INSUFFICIENT WINDOW' : selectedWindow.trainFeasibility === 'TRAIN CONFLICT' ? 'TRAIN CONFLICT' : 'FEASIBLE';
    return { ...bundle, members: members.map((task) => ({ id: String(task._id), sourceId: task.sourceId, department: task.department, defectType: task.defectType, durationMin: task.durationMin, priorityScore: task.priorityScore ?? null })), candidateWindows, selectedWindow, operationalStatus, utilizationPercent: selectedWindow ? Math.round(bundle.after_block_minutes / selectedWindow.durationMin * 100) : null };
  });
  const departmentCombinations = Object.values(bundles.reduce((all, bundle) => { const label = bundle.departments.join(' + '); all[label] = { label, bundles: (all[label]?.bundles || 0) + 1 }; return all; }, {}));
  return { corridorId, summary: { bundleCandidates: bundles.length, multiDepartmentBundles: bundles.filter((bundle) => bundle.departments.length > 1).length, tasksBundled: bundles.reduce((total, bundle) => total + bundle.tasks_combined, 0), potentialBlockRequestsAvoided: bundles.reduce((total, bundle) => total + Math.max(0, bundle.tasks_combined - 1), 0) }, departmentCombinations, bundles };
}
export async function getGoodsForecastWorkspace(query) {
  const corridorId = query.corridorId || 'NDLS-KKDE';
  const [forecasts, windows] = await Promise.all([
    GoodsForecast.find().sort({ date: 1, startMin: 1, forecastId: 1 }).lean(),
    CorridorAvailability.find({ corridorId }).sort({ date: 1, startMin: 1 }).lean()
  ]);
  // This is the optimizer's freight() basis before its selected profile weight.
  const penaltyBasis = (forecast) => Math.round(Number(forecast.capacityDemand || 0) * 100);
  const overlaps = (left, right) => Math.max(left.startMin, right.startMin) < Math.min(left.endMin, right.endMin);
  const enriched = forecasts.map((forecast) => {
    const affectedWindows = windows.filter((window) => window.sectionId === forecast.sectionId && overlaps(window, forecast)).map((window) => ({ id: window.coaId, sectionId: window.sectionId, date: window.date, startMin: window.startMin, endMin: window.endMin, status: window.availabilityStatus }));
    return { id: forecast.forecastId, date: forecast.date, sectionId: forecast.sectionId, startMin: forecast.startMin, endMin: forecast.endMin, expectedGoodsTrains: forecast.expectedGoodsTrains, trafficIntensity: forecast.trafficIntensity, confidence: forecast.confidence, capacityDemand: forecast.capacityDemand, penaltyBasis: penaltyBasis(forecast), affectedWindows };
  });
  const sectionPressure = Object.values(enriched.reduce((all, forecast) => { const item = all[forecast.sectionId] || { sectionId: forecast.sectionId, demand: 0, expectedGoodsTrains: 0, records: 0 }; item.demand += forecast.capacityDemand; item.expectedGoodsTrains += forecast.expectedGoodsTrains; item.records += 1; all[forecast.sectionId] = item; return all; }, {})).sort((a, b) => b.demand - a.demand);
  return { corridorId, solver: { classification: 'SOFT OBJECTIVE PENALTY', formula: 'freight weight × sum(round(capacity demand × 100)) for matching section/time forecasts', profiles: [20, 65, 10] }, summary: { forecastRecords: enriched.length, sectionsCovered: sectionPressure.length, highPressurePeriods: enriched.filter((forecast) => forecast.trafficIntensity === 'HIGH').length, coaWindowsAffected: new Set(enriched.flatMap((forecast) => forecast.affectedWindows.map((window) => window.id))).size }, sectionPressure, forecasts: enriched };
}
export async function getConflictShieldWorkspace(query) {
  const corridorId = query.corridorId || 'NDLS-KKDE';
  const [bundler, forecasts, trains] = await Promise.all([getBundlerWorkspace({ corridorId }), GoodsForecast.find().lean(), Train.find().lean()]);
  const candidates = await Promise.all(bundler.bundles.map(async (bundle) => {
    const window = bundle.selectedWindow;
    if (!window) return { id: bundle.bundle_id, sectionId: bundle.section_id, departments: bundle.departments, tasks: bundle.members, window: null, coaStatus: null, trainCheck: 'NOT CHECKED', resourceCheck: 'NOT CHECKED', goodsPressure: null, result: 'REJECTED', reason: 'No persisted COA window fits the bundle duration and shared task window', conflicts: [] };
    const assignments = bundle.members.map((task) => ({ task_id: task.id, window_id: window.id, section_id: bundle.section_id, start_min: window.startMin, end_min: window.startMin + bundle.after_block_minutes, resources: [task.department] }));
    const response = await aiRequest('/v1/conflict', { assignments, trains: trains.map((train) => ({ id: train.trainId, route: train.route, departure: train.departureMin, arrival: train.arrivalMin })), safety_margin_min: TRAIN_SAFETY_MARGIN_MIN });
    const conflicts = response.conflicts || [];
    const unsafe = conflicts.filter((conflict) => conflict.classification === 'UNSAFE');
    const goods = forecasts.filter((forecast) => forecast.sectionId === bundle.section_id && Math.max(forecast.startMin, window.startMin) < Math.min(forecast.endMin, window.endMin));
    const goodsPressure = goods.length ? goods.sort((left, right) => right.capacityDemand - left.capacityDemand)[0].trafficIntensity : 'NONE';
    return { id: bundle.bundle_id, sectionId: bundle.section_id, departments: bundle.departments, tasks: bundle.members, window, coaStatus: window.status, trainCheck: unsafe.some((conflict) => conflict.type === 'TRAIN_TIMETABLE') ? 'TRAIN CONFLICT' : 'PASS', resourceCheck: unsafe.some((conflict) => conflict.type === 'RESOURCE_OCCUPANCY') ? 'RESOURCE CONFLICT' : 'PASS', goodsPressure, result: unsafe.length ? 'CONFLICT' : 'VALID', reason: unsafe[0]?.reason || 'COA window, train protection, and distinct department resources passed', conflicts };
  }));
  return { corridorId, rippleCheck: { status: 'NOT IMPLEMENTED', detail: 'No downstream/ripple impact calculation exists in the current Conflict Shield or simulation services.' }, safetyMarginMin: TRAIN_SAFETY_MARGIN_MIN, summary: { candidatesChecked: candidates.length, conflictFree: candidates.filter((candidate) => candidate.result === 'VALID').length, conflictsDetected: candidates.filter((candidate) => candidate.result === 'CONFLICT').length, sectionsAffected: new Set(candidates.map((candidate) => candidate.sectionId)).size }, candidates };
}
export async function listAudit(query) { return AuditLog.find({ ...(query.entityType ? { entityType: query.entityType } : {}) }).sort({ createdAt: -1 }).limit(100).lean(); }
export async function getWorkflowOverview(query) {
  const corridorId = query.corridorId || 'NDLS-KKDE';
  const taskFilter = { corridorId };
  const [tasks, latestRun, activeBlocks, stations, trackSections, coa, goods, assets, resources, trains, stationRecords, networkRecords] = await Promise.all([
    MaintenanceTask.find(taskFilter).sort({ dueAt: 1 }).lean(),
    PlanningRun.findOne({ corridorId }).sort({ createdAt: -1 }).lean(),
    Plan.countDocuments({ status: { $in: ['APPROVED', 'PUBLISHED', 'EXECUTING'] } }), Station.countDocuments(), Network.countDocuments(), CorridorAvailability.countDocuments({ corridorId }), GoodsForecast.countDocuments(), Asset.countDocuments(), DepartmentResource.countDocuments(), Train.countDocuments(), Station.find().lean(), Network.find().lean()
  ]);
  const plans = latestRun ? await Plan.find({ runId: latestRun._id }).sort({ 'metrics.gati': 1 }).lean() : [];
  const byDepartment = ['ENGINEERING', 'SNT', 'TRD'].map((department) => ({ department, tasks: tasks.filter((task) => task.department === department).length }));
  const critical = tasks.filter((task) => task.severity >= 4 && task.status !== 'COMPLETED');
  const recommended = plans.slice().sort((left, right) => (left.metrics?.gati ?? Infinity) - (right.metrics?.gati ?? Infinity))[0] || null;
  return {
    corridorId, stations, trackSections, assets: new Set(tasks.map((task) => task.assetId)).size,
    activeMaintenance: tasks.filter((task) => task.status === 'OPEN' || task.status === 'SCHEDULED').length,
    activeBlocks, criticalAlerts: critical.length, departments: byDepartment, tasks, plans, stationsData: stationRecords, networkData: networkRecords, planningInputs: { coaWindows: coa, goodsForecasts: goods, assets, resources, trains },
    optimizationRun: latestRun ? { id: String(latestRun._id), status: latestRun.status, errorDetail: latestRun.errorDetail, evidence: latestRun.optimization || null } : null,
    recommendedPlanId: recommended?._id?.toString() || null,
    stages: {
      maintenance: tasks.length ? 'COMPLETED' : 'PENDING', priority: tasks.some((task) => task.priorityScore != null) ? 'COMPLETED' : 'PENDING',
      planning: plans.length ? 'COMPLETED' : 'PENDING', approval: plans.some((plan) => plan.status === 'APPROVED' || plan.status === 'PUBLISHED') ? 'COMPLETED' : 'PENDING',
      publish: plans.some((plan) => plan.status === 'PUBLISHED') ? 'COMPLETED' : 'PENDING'
    }
  };
}

// RiskClock is calculated by the AI engine.  This read model returns the
// persisted evidence from a workflow run, or asks that same authoritative
// service to recalculate evidence for tasks which have not been planned yet.
export async function getRiskClockAnalysis(query) {
  const corridorId = query.corridorId || 'NDLS-KKDE';
  const tasks = await MaintenanceTask.find({ corridorId, status: { $ne: 'COMPLETED' } }).lean();
  const scored = await Promise.all(tasks.map(async (task) => {
    const persisted = task.priorityFactors;
    let scoring = Number.isFinite(task.priorityScore) && persisted?.components ? persisted : null;
    if (!scoring) {
      try { scoring = (await aiRequest('/v1/priority', {
        criticality: task.criticality, severity: task.severity,
        overdue_days: task.overdueDays ?? 0, weather_risk: task.weatherFactor ?? 0,
        asset_importance: task.assetImportance ?? 1, season: task.season ?? 'Other',
        // The planning workflow currently relies on the AI engine's documented
        // default section importance of 1; there is no persisted task field.
        section_importance: 1
      })).priority; }
      catch { return { ...task, riskClock: null }; }
    }
    return {
      ...task, riskClock: { score: Number.isFinite(task.priorityScore) && persisted?.components ? task.priorityScore : scoring.score, factors: scoring, inputs: { sectionImportance: 1 }, source: Number.isFinite(task.priorityScore) && persisted?.components ? 'PERSISTED_WORKFLOW' : 'LIVE_AUTHORITATIVE_RECALCULATION' }
    };
  }));
  return { corridorId, tasks: scored, factorDefinitions: ['defect_severity', 'asset_criticality', 'overdue_maintenance', 'weather_condition', 'asset_importance', 'track_section_importance', 'urgency', 'availability_impact'] };
}

export async function getBlockPlanningWorkspace(query) {
  const corridorId = query.corridorId || 'NDLS-KKDE';
  const [tasks, windows, trains, goods, network, resources, assets, plans] = await Promise.all([
    MaintenanceTask.find({ corridorId, status: { $in: ['OPEN', 'SCHEDULED'] } }).lean(),
    CorridorAvailability.find({ corridorId }).sort({ date: 1, startMin: 1 }).lean(), Train.find().lean(), GoodsForecast.find().lean(),
    Network.find().lean(), DepartmentResource.find().lean(), Asset.find().lean(), Plan.find().sort({ createdAt: -1 }).limit(3).lean()
  ]);
  const priorityTasks = tasks.filter((task) => Number.isFinite(task.priorityScore)).sort((a, b) => b.priorityScore - a.priorityScore);
  const aiTasks = priorityTasks.map((task) => ({ id: String(task._id), section_id: task.sectionId || task.assetId, department: task.department, resources: task.resources || [task.department], duration_min: task.durationMin, earliest_start: task.windowEarliestMin ?? 0, latest_end: task.windowLatestMin ?? 1440 }));
  let bundles = [], conflicts = [];
  try { bundles = (await aiRequest('/v1/bundler', { tasks: aiTasks })).bundles || []; } catch { /* Source inputs remain useful when the AI endpoint is unavailable. */ }
  const latest = plans[0];
  if (latest?.blocks?.length) {
    const assignments = latest.blocks.flatMap((block) => (block.taskIds || []).map((taskId) => ({ task_id: String(taskId), window_id: block.windowId, section_id: block.sectionId, start_min: block.startMin, end_min: block.endMin, resources: tasks.find((task) => String(task._id) === String(taskId))?.resources || [] })));
    try { conflicts = (await aiRequest('/v1/conflict', { assignments, trains: trains.map((train) => ({ id: train.trainId, route: train.route, departure: train.departureMin, arrival: train.arrivalMin })), safety_margin_min: 10 })).conflicts || []; } catch { /* Do not manufacture conflict evidence. */ }
  }
  return { priorityTasks, windows, trains, goods, network, resources, assets, bundles, conflicts, planBlocks: latest?.blocks || [] };
}

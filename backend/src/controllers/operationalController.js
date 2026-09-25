import { changePlanStatus, createPlan, deletePlan, getBlockPlanningWorkspace, getBundlerWorkspace, getCoaWorkspace, getConflictShieldWorkspace, getGoodsForecastWorkspace, getPlan, getRiskClockAnalysis, getTimetableWorkspace, getWorkflowOverview, listAdminData, listAudit, listNotifications, listPlans, listTasks, markNotificationRead, updatePlan } from '../services/operationalService.js';
import { repairPlanForEmergency } from '../services/workflowService.js';
import { evidenceForPlan, schedulesForPlan, transitionPlan } from '../services/workflowService.js';
import { generateCsvReport } from '../services/reportService.js';
const send = (req, res, data) => res.json({ data, meta: { requestId: req.id } });
export async function tasksController(req, res, next) { try { send(req, res, await listTasks(req.query)); } catch (error) { next(error); } }
export async function plansController(req, res, next) { try { send(req, res, await listPlans(req.params.runId, req.query)); } catch (error) { next(error); } }
export async function planController(req, res, next) { try { const plan = await getPlan(req.params.planId); if (!plan) return res.status(404).json({ type: 'about:blank', title: 'Not Found', status: 404, detail: 'Plan not found' }); send(req, res, plan); } catch (error) { next(error); } }
export async function createPlanController(req, res, next) { try { send(req, res, await createPlan(req.body)); } catch (error) { next(error); } }
export async function updatePlanController(req, res, next) { try { const plan = await updatePlan(req.params.planId, req.body); if (!plan) return res.status(409).json({ type: 'about:blank', title: 'Conflict', status: 409, detail: 'Only editable plans can be changed' }); send(req, res, plan); } catch (error) { next(error); } }
export async function deletePlanController(req, res, next) { try { const plan = await deletePlan(req.params.planId); if (!plan) return res.status(409).json({ type: 'about:blank', title: 'Conflict', status: 409, detail: 'Only draft plans can be deleted' }); send(req, res, plan); } catch (error) { next(error); } }
export async function statusController(req, res, next) { try { send(req, res, await transitionPlan(req.params.planId, req.body.status, req.user.sub, req.body.comment, req.id)); } catch (error) { next(error); } }
export async function notificationsController(req, res, next) { try { send(req, res, await listNotifications(req.user.sub, req.query)); } catch (error) { next(error); } }
export async function notificationReadController(req, res, next) { try { send(req, res, await markNotificationRead(req.params.notificationId, req.user.sub)); } catch (error) { next(error); } }
export async function adminController(req, res, next) { try { send(req, res, await listAdminData(req.params.type)); } catch (error) { next(error); } }
export async function auditController(req, res, next) { try { send(req, res, await listAudit(req.query)); } catch (error) { next(error); } }
export async function simulationController(req, res, next) { try { const [simulation] = await evidenceForPlan(req.params.planId); if (!simulation) return res.status(404).json({ type: 'about:blank', title: 'Not Found', status: 404, detail: 'Simulation result not found' }); send(req, res, simulation); } catch (error) { next(error); } }
export async function riskController(req, res, next) { try { const [, risk] = await evidenceForPlan(req.params.planId); if (!risk) return res.status(404).json({ type: 'about:blank', title: 'Not Found', status: 404, detail: 'Risk report not found' }); send(req, res, risk); } catch (error) { next(error); } }
export async function reportController(req, res, next) {
  try {
    const report = await generateCsvReport(req.query.type, req.query.corridorId);
    if (req.query.format !== 'csv') return send(req, res, report.data);
    res.status(200);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${report.filename}"`,
      'Content-Length': Buffer.byteLength(report.content, 'utf8')
    });
    return res.send(report.content);
  } catch (error) {
    console.error(`[reports] requestId=${req.id} type=${req.query.type ?? 'maintenance'} failed`, error);
    return next(error);
  }
}
export async function workflowOverviewController(req, res, next) { try { send(req, res, await getWorkflowOverview(req.query)); } catch (error) { next(error); } }
export async function riskClockController(req, res, next) { try { send(req, res, await getRiskClockAnalysis(req.query)); } catch (error) { next(error); } }
export async function blockPlanningController(req, res, next) { try { send(req, res, await getBlockPlanningWorkspace(req.query)); } catch (error) { next(error); } }
export async function coaController(req, res, next) { try { send(req, res, await getCoaWorkspace(req.query)); } catch (error) { next(error); } }
export async function timetableController(req, res, next) { try { send(req, res, await getTimetableWorkspace(req.query)); } catch (error) { next(error); } }
export async function bundlerController(req, res, next) { try { send(req, res, await getBundlerWorkspace(req.query)); } catch (error) { next(error); } }
export async function goodsForecastController(req, res, next) { try { send(req, res, await getGoodsForecastWorkspace(req.query)); } catch (error) { next(error); } }
export async function conflictShieldController(req, res, next) { try { send(req, res, await getConflictShieldWorkspace(req.query)); } catch (error) { next(error); } }
export async function emergencyRepairController(req, res, next) { try { send(req, res, await repairPlanForEmergency(req.params.planId, req.body, req.user.sub, req.id)); } catch (error) { next(error); } }
export async function schedulesController(req, res, next) { try { send(req, res, await schedulesForPlan(req.params.planId)); } catch (error) { next(error); } }

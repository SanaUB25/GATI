import { changePlanStatus, createPlan, deletePlan, getPlan, getWorkflowOverview, listAdminData, listAudit, listNotifications, listPlans, listTasks, markNotificationRead, updatePlan } from '../services/operationalService.js';
const send = (req, res, data) => res.json({ data, meta: { requestId: req.id } });
export async function tasksController(req, res, next) { try { send(req, res, await listTasks(req.query)); } catch (error) { next(error); } }
export async function plansController(req, res, next) { try { send(req, res, await listPlans(req.params.runId, req.query)); } catch (error) { next(error); } }
export async function planController(req, res, next) { try { const plan = await getPlan(req.params.planId); if (!plan) return res.status(404).json({ type: 'about:blank', title: 'Not Found', status: 404, detail: 'Plan not found' }); send(req, res, plan); } catch (error) { next(error); } }
export async function createPlanController(req, res, next) { try { send(req, res, await createPlan(req.body)); } catch (error) { next(error); } }
export async function updatePlanController(req, res, next) { try { const plan = await updatePlan(req.params.planId, req.body); if (!plan) return res.status(409).json({ type: 'about:blank', title: 'Conflict', status: 409, detail: 'Only editable plans can be changed' }); send(req, res, plan); } catch (error) { next(error); } }
export async function deletePlanController(req, res, next) { try { const plan = await deletePlan(req.params.planId); if (!plan) return res.status(409).json({ type: 'about:blank', title: 'Conflict', status: 409, detail: 'Only draft plans can be deleted' }); send(req, res, plan); } catch (error) { next(error); } }
export async function statusController(req, res, next) { try { send(req, res, await changePlanStatus(req.params.planId, req.body.status, req.user.sub)); } catch (error) { next(error); } }
export async function notificationsController(req, res, next) { try { send(req, res, await listNotifications(req.user.sub, req.query)); } catch (error) { next(error); } }
export async function notificationReadController(req, res, next) { try { send(req, res, await markNotificationRead(req.params.notificationId, req.user.sub)); } catch (error) { next(error); } }
export async function adminController(req, res, next) { try { send(req, res, await listAdminData(req.params.type)); } catch (error) { next(error); } }
export async function auditController(req, res, next) { try { send(req, res, await listAudit(req.query)); } catch (error) { next(error); } }
export async function reportController(req, res) { send(req, res, { type: req.query.type || 'daily', status: 'AVAILABLE', generatedAt: new Date().toISOString(), downloadUrl: null }); }
export async function workflowOverviewController(req, res, next) { try { send(req, res, await getWorkflowOverview(req.query)); } catch (error) { next(error); } }

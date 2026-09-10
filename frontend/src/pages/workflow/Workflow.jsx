import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { operationsApi } from '../../api/operationsApi.js';

const stages = [
  ['network', 'Network Overview'], ['maintenance-data', 'Maintenance Data'], ['risk-clock', 'RiskClock'], ['priority', 'Priority Score'], ['block-planning', 'Block Planning'], ['coa', 'COA Integration'], ['timetable', 'Train Timetable'], ['goods-forecast', 'Goods Forecast'], ['bundler', 'Block Bundler'], ['conflict-shield', 'Conflict Shield / Ripple Check'], ['optimization', 'CP-SAT Optimization'], ['candidate-plans', 'Candidate Plans'], ['monte-carlo', 'Monte Carlo Simulation'], ['risk-analysis', 'Risk Analysis'], ['gati-score', 'GATI Score'], ['explainability', 'Show Your Work'], ['trade-off', 'Trade-Off Dial'], ['final-plan', 'Final Recommended Plan'], ['weekly-plan', 'Weekly Plan'], ['monthly-plan', 'Monthly Plan'], ['approval', 'CTO Approval'], ['publish', 'Publish']
];
const stageStatus = (id, data) => {
  if (id === 'maintenance-data') return data?.stages?.maintenance || 'PENDING';
  if (id === 'priority') return data?.stages?.priority || 'PENDING';
  if (['candidate-plans', 'final-plan'].includes(id)) return data?.stages?.planning || 'PENDING';
  if (id === 'approval') return data?.stages?.approval || 'PENDING';
  if (id === 'publish') return data?.stages?.publish || 'PENDING';
  return 'PENDING';
};

function useWorkflow() {
  const [state, setState] = useState({ loading: true, error: '', data: null });
  useEffect(() => { let active = true; operationsApi.workflowOverview().then((response) => active && setState({ loading: false, error: '', data: response.data.data })).catch((error) => active && setState({ loading: false, error: error.response?.data?.detail || 'The workflow data could not be loaded.', data: null })); return () => { active = false; }; }, []);
  return state;
}
function Breadcrumb({ title }) { return <nav className="breadcrumb" aria-label="Breadcrumb"><Link to="/">Control center</Link><span>/</span><Link to="/workflow">Workflow</Link><span>/</span><strong>{title}</strong></nav>; }
function LoadingSkeleton() { return <div className="skeleton-stack" aria-label="Loading"><i /><i /><i /></div>; }
function StateMessage({ error, children }) { return <div className={error ? 'workflow-message error-state' : 'workflow-message'}><strong>{error ? 'Unable to load this stage' : 'No operational data yet'}</strong><p>{error || children}</p></div>; }
function PageFrame({ title, eyebrow, children }) { return <main className="content"><Breadcrumb title={title} /><header><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1></div></header>{children}</main>; }

export function Workflow() {
  const { loading, error, data } = useWorkflow();
  return <PageFrame title="Planning workflow" eyebrow="RAILVISTA DECISION PIPELINE"><section className="operations-content">{loading ? <LoadingSkeleton /> : error ? <StateMessage error={error} /> : <><div className="workflow-summary"><span className="signal-dot" />Live corridor: {data.corridorId}</div><div className="workflow-nodes">{stages.map(([id, name], index) => <motion.div key={id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .025 }} className="workflow-node-wrap"><Link className="workflow-node" to={`/workflow/${id}`}><span className="node-index">{String(index + 1).padStart(2, '0')}</span><strong>{name}</strong><span className={`stage-status ${stageStatus(id, data).toLowerCase()}`}>{stageStatus(id, data)}</span></Link>{index < stages.length - 1 && <span className="workflow-connector" />}</motion.div>)}</div></>}</section></PageFrame>;
}

export function NetworkOverview() {
  const { loading, error, data } = useWorkflow();
  return <PageFrame title="Network overview" eyebrow="CORRIDOR ASSET REGISTER"><section className="operations-content">{loading ? <LoadingSkeleton /> : error ? <StateMessage error={error} /> : <><div className="metric-grid"><Metric label="Track sections" value={data.trackSections} note="Registered sections" /><Metric label="Stations" value={data.stations} note="Registered stations" /><Metric label="Assets" value={data.assets} note="From maintenance register" /><Metric label="Critical alerts" value={data.criticalAlerts} note="Open severity 4–5 tasks" /></div><article className="panel"><div className="panel-heading"><div><p className="eyebrow">DEPARTMENT OWNERSHIP</p><h3>Current corridor workload</h3></div><span className="status">{data.corridorId}</span></div>{data.departments.map((department) => <div className="plan-row" key={department.department}><strong>{department.department}</strong><span>{department.tasks} maintenance items</span></div>)}{!data.tasks.length && <StateMessage>Import maintenance demand to populate the corridor asset view.</StateMessage>}</article></>}</section></PageFrame>;
}

export function WorkflowStage({ stageId }) {
  const { loading, error, data } = useWorkflow();
  const stage = stages.find(([id]) => id === stageId) || stages[0];
  const [id, title] = stage;
  const status = stageStatus(id, data);
  const tasks = data?.tasks || [];
  const stageDetails = { 'maintenance-data': ['Maintenance records', tasks.length, 'Canonical work items ready for review'], 'risk-clock': ['Risk inputs', data?.criticalAlerts || 0, 'Critical open maintenance signals'], priority: ['Scored tasks', tasks.filter((task) => task.priorityScore != null).length, 'Priority scores from the demand register'], 'block-planning': ['Active blocks', data?.activeBlocks || 0, 'Approved, published, or executing plans'], coa: ['COA windows', 0, 'No COA adapter is connected'], timetable: ['Timetable records', 0, 'No timetable adapter is connected'], 'goods-forecast': ['Forecast records', 0, 'No goods forecast adapter is connected'], bundler: ['Bundle candidates', 0, 'Run planning to generate compatible bundles'], 'conflict-shield': ['Validated plans', data?.plans?.length || 0, 'Persisted planning candidates'], optimization: ['CP-SAT candidates', data?.plans?.length || 0, 'Generated plans are ranked after simulation'], 'monte-carlo': ['Scenario results', 0, 'Simulation results are not yet persisted'], 'risk-analysis': ['Risk reports', data?.plans?.filter((plan) => plan.metrics?.gati != null).length || 0, 'Risk metrics are attached to evaluated plans'], 'gati-score': ['Scored plans', data?.plans?.filter((plan) => plan.metrics?.gati != null).length || 0, 'GATI ranks plans with persisted delay metrics'], explainability: ['Evidence packs', data?.plans?.length || 0, 'Use Gemini assistant for grounded plan questions'], 'trade-off': ['Comparable plans', data?.plans?.length || 0, 'Compare coverage, risk, and delay before approval'], 'weekly-plan': ['Weekly plans', data?.plans?.length || 0, 'Published plan data will appear here'], 'monthly-plan': ['Monthly plans', data?.plans?.length || 0, 'Published plan data will appear here'] };
  const detail = stageDetails[id] || [title, data?.plans?.length || 0, 'Continue through the controlled planning workflow.'];
  return <PageFrame title={title} eyebrow="WORKFLOW STAGE"><section className="operations-content">{loading ? <LoadingSkeleton /> : error ? <StateMessage error={error} /> : <><article className="panel stage-panel"><span className={`stage-status ${status.toLowerCase()}`}>{status}</span><h3>{detail[0]}</h3><strong className="stage-value">{detail[1]}</strong><p className="muted">{detail[2]}</p>{id === 'maintenance-data' && tasks.length > 0 && <div className="table-wrap"><table><thead><tr><th>Source</th><th>Department</th><th>Asset</th><th>Status</th></tr></thead><tbody>{tasks.map((task) => <tr key={task._id}><td>{task.sourceSystem}</td><td>{task.department}</td><td>{task.assetId}</td><td>{task.status}</td></tr>)}</tbody></table></div>}{detail[1] === 0 && <StateMessage>{detail[2]}</StateMessage>}</article><Link className="workflow-next" to={id === 'monthly-plan' ? '/workflow/approval' : `/workflow/${stages[Math.min(stages.findIndex(([key]) => key === id) + 1, stages.length - 1)][0]}`}>Continue to next stage →</Link></>}</section></PageFrame>;
}
function Metric({ label, value, note }) { return <article className="metric"><p>{label}</p><strong>{value}</strong><small>{note}</small></article>; }

export function CandidatePlansPage({ mode = 'candidate' }) {
  const { loading, error, data } = useWorkflow(); const navigate = useNavigate();
  const [actionError, setActionError] = useState('');
  const plans = data?.plans || []; const title = mode === 'final' ? 'Final recommended plan' : 'Candidate plans';
  const recommend = plans.slice().sort((a, b) => (a.metrics?.gati ?? Infinity) - (b.metrics?.gati ?? Infinity))[0];
  const changeStatus = async (plan, status) => { try { setActionError(''); await operationsApi.updatePlanStatus(plan._id, status); navigate(0); } catch (requestError) { setActionError(requestError.response?.data?.detail || 'The plan status could not be updated.'); } };
  return <PageFrame title={title} eyebrow={mode === 'final' ? 'RECOMMENDATION REVIEW' : 'PLAN COMPARISON'}><section className="operations-content">{loading ? <LoadingSkeleton /> : error ? <StateMessage error={error} /> : !plans.length ? <StateMessage>Generate and persist a planning run to compare Plan A, Plan B, and Plan C.</StateMessage> : <>{actionError && <StateMessage error={actionError} />}<div className="plan-card-grid">{plans.map((plan, index) => <article className={plan._id === recommend?._id ? 'plan-card recommended' : 'plan-card'} key={plan._id}><div className="panel-heading"><div><p className="eyebrow">{plan._id === recommend?._id ? 'LOWEST GATI' : 'ALTERNATIVE'}</p><h3>{plan.name || `Plan ${String.fromCharCode(65 + index)}`}</h3></div><span className={`stage-status ${plan.status?.toLowerCase()}`}>{plan.status}</span></div><div className="plan-measures"><Measure label="Maintenance time" value={plan.metrics?.maintenanceTime} /><Measure label="Estimated delay" value={plan.metrics?.meanDelay} suffix=" min" /><Measure label="Risk score" value={plan.metrics?.cvar10} /><Measure label="Emergencies" value={plan.metrics?.emergencyRate} /><Measure label="GATI score" value={plan.metrics?.gati} /><Measure label="Resource usage" value={plan.metrics?.resourceUsage} /></div>{mode === 'final' && plan.status !== 'APPROVED' && <button className="primary" onClick={() => changeStatus(plan, 'APPROVED')}>Send for CTO approval</button>}</article>)}</div></>}</section></PageFrame>;
}
function Measure({ label, value, suffix = '' }) { return <div><span>{label}</span><strong>{value == null ? '—' : `${value}${suffix}`}</strong></div>; }

export function ApprovalPublish({ publish = false }) {
  const { loading, error, data } = useWorkflow(); const navigate = useNavigate(); const plan = data?.plans?.find((item) => publish ? item.status === 'APPROVED' : item.status === 'APPROVED' || item.status === 'REVIEW');
  const [actionError, setActionError] = useState('');
  const status = publish ? 'PUBLISHED' : 'APPROVED';
  async function update() { if (!plan) return; try { setActionError(''); await operationsApi.updatePlanStatus(plan._id, status); navigate(0); } catch (requestError) { setActionError(requestError.response?.data?.detail || 'The plan status could not be updated.'); } }
  return <PageFrame title={publish ? 'Publish plan' : 'CTO approval'} eyebrow="HUMAN-IN-THE-LOOP GOVERNANCE"><section className="operations-content">{loading ? <LoadingSkeleton /> : error ? <StateMessage error={error} /> : !plan ? <StateMessage>{publish ? 'An approved plan is required before publication.' : 'A reviewed candidate plan is required before CTO approval.'}</StateMessage> : <>{actionError && <StateMessage error={actionError} />}<article className="panel approval-panel"><span className={`stage-status ${plan.status.toLowerCase()}`}>{plan.status}</span><h3>{plan.name || 'Selected plan'}</h3><p className="muted">Approval and publication are explicit status changes on the persisted plan record.</p><button className="primary" onClick={update}>{publish ? 'Publish approved plan' : 'Approve plan'}</button></article></>}</section></PageFrame>;
}

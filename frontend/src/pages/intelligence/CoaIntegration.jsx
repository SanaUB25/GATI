import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { operationsApi } from '../../api/operationsApi.js';

const time = (minutes) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const date = (value) => new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
const tone = (value) => value.toLowerCase();

export function CoaIntegration() {
  const [state, setState] = useState({ loading: true, error: '', data: null });
  const [selectedId, setSelectedId] = useState('');
  useEffect(() => {
    operationsApi.coa().then((response) => {
      const data = response.data.data;
      setState({ loading: false, error: '', data });
      setSelectedId(data.windows.find((window) => window.status === 'AVAILABLE')?.id || data.windows[0]?.id || '');
    }).catch((error) => setState({ loading: false, error: error.response?.data?.detail || 'Control Office availability could not be loaded.', data: null }));
  }, []);
  const selected = useMemo(() => state.data?.windows.find((window) => window.id === selectedId), [state.data, selectedId]);
  const maxMinutes = Math.max(...(state.data?.sectionAvailability || []).map((item) => item.possessionMin), 1);
  return <main className="content"><nav className="breadcrumb"><Link to="/">Control center</Link><span>/</span><Link to="/workflow">Workflow</Link><span>/</span><strong>COA integration</strong></nav><header><div><p className="eyebrow">CONTROL OFFICE INPUT</p><h1>COA integration</h1><p className="muted coa-subtitle">Control Office possession availability for maintenance planning</p></div></header><section className="operations-content">
    {state.loading && <div className="skeleton-stack"><i /><i /><i /></div>}
    {state.error && <div className="workflow-message error-state"><strong>Unable to load COA availability</strong><p>{state.error}</p></div>}
    {state.data && <div className="coa-content"><div className="metric-grid coa-kpis"><Metric label="Total windows" value={state.data.summary.totalWindows} note="Persisted COA records" /><Metric label="Available" value={state.data.summary.availableWindows} note="Authoritative COA status" /><Metric label="Restricted / blocked" value={state.data.summary.restrictedBlockedWindows} note="Requires status-aware planning" /><Metric label="Total possession time" value={`${state.data.summary.totalPossessionMin} min`} note="Non-blocked windows" /></div>
      {!state.data.windows.length ? <div className="workflow-message"><strong>No Control Office possession windows are available.</strong><p>Run the normal demo seed to import the synthetic COA source.</p></div> : <div className="coa-workspace">
        <section className="workspace coa-top"><article className="panel"><div className="panel-heading"><div><p className="eyebrow">SECTION AVAILABILITY</p><h3>Useful maintenance opportunities</h3></div><span className="evidence-source">Persisted COA</span></div><div className="coa-section-bars">{state.data.sectionAvailability.map((item) => <div key={item.sectionId}><strong>{item.sectionId}</strong><i><b style={{ width: `${item.possessionMin / maxMinutes * 100}%` }} /></i><span>{item.possessionMin} min · {item.availableWindows} windows</span></div>)}</div></article><article className="panel coa-flow"><p className="eyebrow">PLANNING HANDOFF</p><h3>Possession constrains scheduling</h3><div className="coa-flow-steps"><strong>COA availability</strong><i>↓</i><strong>Operational feasibility</strong><i>↓</i><strong>Block planning</strong><i>↓</i><strong>CP-SAT</strong></div><p>Eligible possession windows constrain when maintenance can be scheduled.</p></article></section>
        <article className="panel"><div className="panel-heading"><div><p className="eyebrow">CONTROL OFFICE POSSESSION WINDOWS</p><h3>Persisted availability by section</h3></div><span className="status">{state.data.corridorId}</span></div><div className="table-wrap coa-table"><table><thead><tr><th>Window</th><th>Section</th><th>Date</th><th>Start</th><th>End</th><th>Duration</th><th>Status</th><th>Eligible tasks</th></tr></thead><tbody>{state.data.windows.map((window) => <tr key={window.id} onClick={() => setSelectedId(window.id)} className={selected?.id === window.id ? 'selected' : ''}><td><strong>{window.id}</strong></td><td>{window.sectionId}</td><td>{date(window.date)}</td><td>{time(window.startMin)}</td><td>{time(window.endMin)}</td><td>{window.durationMin} min</td><td><span className={`risk-pill ${tone(window.status)}`}>{window.status}</span></td><td>{window.eligibleTasks.length}</td></tr>)}</tbody></table></div></article>
        {selected && <section className="workspace coa-detail"><article className="panel"><div className="panel-heading"><div><p className="eyebrow">SELECTED WINDOW</p><h3>{selected.id} · {selected.sectionId}</h3></div><span className={`risk-pill ${tone(selected.status)}`}>{selected.status}</span></div><div className="coa-detail-grid"><span>Date<b>{date(selected.date)}</b></span><span>Possession<b>{time(selected.startMin)}–{time(selected.endMin)}</b></span><span>Duration<b>{selected.durationMin} min</b></span><span>Type<b>{selected.possessionType}</b></span><span>Departments<b>{selected.allowedDepartments.join(', ')}</b></span><span>Operational check<b className={selected.operationalCheck === 'TRAIN CONFLICT' ? 'conflict' : 'clear'}>{selected.operationalCheck}</b></span></div><p className="coa-note">COA status is Control Office authority. Train conflict is evaluated separately using the planner’s 10-minute safety margin.</p></article><article className="panel"><div className="panel-heading"><div><p className="eyebrow">ELIGIBLE PRIORITIZED MAINTENANCE</p><h3>{selected.eligibleTasks.length ? `${selected.eligibleTasks.length} tasks can fit this possession` : 'No tasks fit this possession'}</h3></div></div>{selected.eligibleTasks.length ? <div className="coa-task-list">{selected.eligibleTasks.map((task) => <div key={task.id}><strong>{task.sourceId}</strong><span>{task.sourceSystem} · {task.department}</span><small>{task.defectType} · {task.durationMin} min · Priority {task.priorityScore == null ? 'not scored' : task.priorityScore.toFixed(1)}</small></div>)}</div> : <p className="muted">Eligibility respects section, task duration, task time window, permitted department, and blocked COA status.</p>}</article></section>}
       </div>}
      <Link className="workflow-next" to="/workflow/timetable">Continue to next stage →</Link>
    </div>}
  </section></main>;
}
function Metric({ label, value, note }) { return <article className="metric"><p>{label}</p><strong>{value}</strong><small>{note}</small></article>; }

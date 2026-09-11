import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Login } from '../pages/auth/Login.jsx';
import { Landing } from '../pages/landing/Landing.jsx';
import { Dashboard } from '../pages/command-overview/Dashboard.jsx';
import { AppShell } from '../components/layout/AppShell.jsx';
import { GatiDashboard, Maintenance, Notifications, Profile, Reports, RiskDashboard, Settings, SimulationResults, Administration } from '../pages/operations/Operations.jsx';
import { Gemini } from '../pages/gemini/Gemini.jsx';
import { ApprovalPublish, CandidatePlansPage, NetworkOverview, Workflow, WorkflowStage } from '../pages/workflow/Workflow.jsx';
import { Bundler, ConflictShield, Explainability, GatiIntelligence, IntelligencePipeline, Optimization, PriorityEngine, RiskAnalysis, RiskClock, Simulation, TradeOff } from '../pages/intelligence/Intelligence.jsx';

function Protected({ children }) { const { session } = useAuth(); return session ? children : <Navigate to="/login" replace />; }
function PageTransition({ children }) { return <motion.div className="page-transition" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: 'easeOut' }}>{children}</motion.div>; }
const animated = (Component) => <PageTransition><Component /></PageTransition>;

export function AppRouter() {
  const location = useLocation();
  return <AnimatePresence mode="wait"><Routes location={location} key={location.pathname}>
    <Route path="/landing" element={<Landing />} />
    <Route path="/login" element={animated(Login)} />
    <Route element={<Protected><AppShell /></Protected>}>
      <Route path="/" element={animated(Dashboard)} /><Route path="/maintenance" element={animated(Maintenance)} />
      <Route path="/plans" element={animated(CandidatePlansPage)} /><Route path="/simulation" element={animated(SimulationResults)} />
      <Route path="/risk" element={animated(RiskDashboard)} /><Route path="/gati" element={animated(GatiDashboard)} />
      <Route path="/gemini" element={animated(Gemini)} /><Route path="/reports" element={animated(Reports)} />
      <Route path="/intelligence" element={animated(IntelligencePipeline)} /><Route path="/intelligence/riskclock" element={animated(RiskClock)} />
      <Route path="/intelligence/priority" element={animated(PriorityEngine)} /><Route path="/intelligence/bundler" element={animated(Bundler)} />
      <Route path="/intelligence/conflicts" element={animated(ConflictShield)} /><Route path="/intelligence/optimization" element={animated(Optimization)} />
      <Route path="/intelligence/simulation" element={animated(Simulation)} /><Route path="/intelligence/risk-analysis" element={animated(RiskAnalysis)} />
      <Route path="/intelligence/gati" element={animated(GatiIntelligence)} /><Route path="/intelligence/explainability" element={animated(Explainability)} />
      <Route path="/intelligence/trade-offs" element={animated(TradeOff)} />
      <Route path="/notifications" element={animated(Notifications)} /><Route path="/admin" element={animated(Administration)} />
      <Route path="/profile" element={animated(Profile)} /><Route path="/settings" element={animated(Settings)} />
      <Route path="/network" element={animated(NetworkOverview)} /><Route path="/workflow" element={animated(Workflow)} />
      <Route path="/workflow/network" element={animated(() => <NetworkOverview />)} />
      <Route path="/workflow/candidate-plans" element={animated(CandidatePlansPage)} /><Route path="/workflow/final-plan" element={animated(() => <CandidatePlansPage mode="final" />)} />
      <Route path="/workflow/approval" element={animated(ApprovalPublish)} /><Route path="/workflow/publish" element={animated(() => <ApprovalPublish publish />)} />
      <Route path="/workflow/maintenance-data" element={animated(() => <WorkflowStage stageId="maintenance-data" />)} />
      <Route path="/workflow/risk-clock" element={animated(() => <WorkflowStage stageId="risk-clock" />)} /><Route path="/workflow/priority" element={animated(() => <WorkflowStage stageId="priority" />)} />
      <Route path="/workflow/block-planning" element={animated(() => <WorkflowStage stageId="block-planning" />)} /><Route path="/workflow/coa" element={animated(() => <WorkflowStage stageId="coa" />)} />
      <Route path="/workflow/timetable" element={animated(() => <WorkflowStage stageId="timetable" />)} /><Route path="/workflow/goods-forecast" element={animated(() => <WorkflowStage stageId="goods-forecast" />)} />
      <Route path="/workflow/bundler" element={animated(() => <WorkflowStage stageId="bundler" />)} /><Route path="/workflow/conflict-shield" element={animated(() => <WorkflowStage stageId="conflict-shield" />)} />
      <Route path="/workflow/optimization" element={animated(() => <WorkflowStage stageId="optimization" />)} /><Route path="/workflow/monte-carlo" element={animated(() => <WorkflowStage stageId="monte-carlo" />)} />
      <Route path="/workflow/risk-analysis" element={animated(() => <WorkflowStage stageId="risk-analysis" />)} /><Route path="/workflow/gati-score" element={animated(() => <WorkflowStage stageId="gati-score" />)} />
      <Route path="/workflow/explainability" element={animated(() => <WorkflowStage stageId="explainability" />)} /><Route path="/workflow/trade-off" element={animated(() => <WorkflowStage stageId="trade-off" />)} />
      <Route path="/workflow/weekly-plan" element={animated(() => <WorkflowStage stageId="weekly-plan" />)} /><Route path="/workflow/monthly-plan" element={animated(() => <WorkflowStage stageId="monthly-plan" />)} />
    </Route><Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AnimatePresence>;
}

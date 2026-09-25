import { AnimatePresence, motion } from 'framer-motion';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Login } from '../pages/auth/Login.jsx';
import { Landing } from '../pages/landing/Landing.jsx';
import { Dashboard } from '../pages/command-overview/Dashboard.jsx';
import { AppShell } from '../components/layout/AppShell.jsx';
import { GatiDashboard, Maintenance, Notifications, Profile, Reports, RiskDashboard, Settings, SimulationResults, Administration } from '../pages/operations/Operations.jsx';
import { ApprovalPublish, CandidatePlansPage, NetworkOverview, Workflow, WorkflowStage } from '../pages/workflow/Workflow.jsx';
import { Bundler, ConflictShield, Explainability, GatiIntelligence, IntelligencePipeline, Optimization, PriorityEngine, RiskAnalysis, Simulation, TradeOff } from '../pages/intelligence/Intelligence.jsx';
import { RiskClock } from '../pages/intelligence/RiskClock.jsx';
import { PriorityScore } from '../pages/intelligence/PriorityScore.jsx';
import { BlockPlanning } from '../pages/intelligence/BlockPlanning.jsx';
import { CoaIntegration } from '../pages/intelligence/CoaIntegration.jsx';
import { TrainTimetable } from '../pages/intelligence/TrainTimetable.jsx';
import { BlockBundler } from '../pages/intelligence/BlockBundler.jsx';
import { GoodsForecast } from '../pages/intelligence/GoodsForecast.jsx';
import { ConflictShield as ConflictShieldPage } from '../pages/intelligence/ConflictShield.jsx';

function Protected({ children }) { const { session } = useAuth(); return session ? children : <Navigate to="/login" replace />; }
function PageTransition({ children }) { return <motion.div className="page-transition" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22, ease: 'easeOut' }}>{children}</motion.div>; }
const animated = (Component) => <PageTransition><Component /></PageTransition>;

export function AppRouter() {
  const location = useLocation();
  return <AnimatePresence mode="wait"><Routes location={location} key={location.pathname}>
    <Route path="/landing" element={<Landing />} />
    <Route path="/login" element={animated(Login)} />
    <Route path="/" element={<Navigate to="/landing" replace />} />
    <Route element={<Protected><AppShell /></Protected>}>
      <Route path="/dashboard" element={animated(Dashboard)} /><Route path="/maintenance" element={animated(Maintenance)} />
      <Route path="/plans" element={animated(CandidatePlansPage)} /><Route path="/simulation" element={animated(SimulationResults)} />
      <Route path="/risk" element={animated(RiskDashboard)} /><Route path="/gati" element={animated(GatiDashboard)} />
      <Route path="/gemini" element={animated(Explainability)} /><Route path="/reports" element={animated(Reports)} />
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
      <Route path="/workflow/risk-clock" element={animated(RiskClock)} /><Route path="/workflow/priority" element={animated(PriorityScore)} />
      <Route path="/workflow/block-planning" element={animated(BlockPlanning)} /><Route path="/workflow/coa" element={animated(CoaIntegration)} />
      <Route path="/workflow/timetable" element={animated(TrainTimetable)} /><Route path="/workflow/goods-forecast" element={animated(GoodsForecast)} />
      <Route path="/workflow/bundler" element={animated(BlockBundler)} /><Route path="/workflow/conflict-shield" element={animated(ConflictShieldPage)} />
      <Route path="/workflow/optimization" element={animated(() => <WorkflowStage stageId="optimization" />)} /><Route path="/workflow/monte-carlo" element={animated(() => <WorkflowStage stageId="monte-carlo" />)} />
      <Route path="/workflow/risk-analysis" element={animated(() => <WorkflowStage stageId="risk-analysis" />)} /><Route path="/workflow/gati-score" element={animated(() => <WorkflowStage stageId="gati-score" />)} />
      <Route path="/workflow/explainability" element={animated(() => <WorkflowStage stageId="explainability" />)} /><Route path="/workflow/trade-off" element={animated(() => <WorkflowStage stageId="trade-off" />)} />
      <Route path="/workflow/weekly-plan" element={animated(() => <WorkflowStage stageId="weekly-plan" />)} /><Route path="/workflow/monthly-plan" element={animated(() => <WorkflowStage stageId="monthly-plan" />)} />
    </Route><Route path="*" element={<Navigate to="/" replace />} />
  </Routes></AnimatePresence>;
}

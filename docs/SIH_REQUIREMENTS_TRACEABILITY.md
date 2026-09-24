# SIH problem-statement traceability

This prototype uses deterministic synthetic adapters. It does not claim a live Indian Railways integration or trained ML.

| Requirement | Implementation / API | Dataset / test | Status |
|---|---|---|---|
| TMS, SMMS, TDMS normalized demand | `MaintenanceTask`, seed maps Engineering/S&T/TRD to TMS/SMMS/TDMS; `GET /api/tasks` | `maintenance_jobs.csv` | PASS |
| RiskClock and priority affect optimizer | `priority_engine.py`, `workflow/run`, CP-SAT priority coefficient | `test_core.py` | PASS |
| COA is a hard constraint | `CorridorAvailability`, backend derives windows, optimizer rejects BLOCKED/outside window | `coa_availability.csv`, dependency test | PASS |
| Train protection | optimizer safety-margin feasibility filter | `trains.csv`, dependency test | PASS |
| Goods forecast affects selection | freight penalty in CP-SAT objective | `goods_forecast.csv`, dependency test | PASS |
| Network/assets/resources | persisted models and planning payload; finite department capacities | network/asset/resource CSVs | PASS |
| Coordinated bundles | `block_bundler.py` creates candidate units consumed by optimizer | dependency test | PASS |
| Simulation/risk/GATI | scenario simulator, risk analysis, GATI persisted per plan | `scenarios.csv`, `test_core.py` | PASS |
| Human selection, weekly/monthly, approval/publish | lifecycle transition materializes schedules; audit/approval records | Plan APIs | PASS |
| Re-optimization / profiles | persisted new PlanningRun; three coefficient profiles | workflow API | PASS |
| Frontend data honesty | workflow planning-input counts and API-backed task/network data | frontend build | PARTIAL |

Remaining UI work is intentionally limited: the generic stage pages summarize persisted data but do not yet render every conflict/bundle evidence field in a dedicated table.

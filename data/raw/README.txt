RAILVISTA — Synthetic Railway Operations Dataset
========================================================

Purpose:
Synthetic/demo data for the RAILVISTA prototype. This dataset is NOT
real Indian Railways operational data and must not be presented as
real railway performance.

Files:
1. network.csv
2. stations.csv
3. trains.csv
4. maintenance_jobs.csv
5. scenarios.csv
6. coa_availability.csv - synthetic Control Office possession windows; BLOCKED windows are never schedulable.
7. goods_forecast.csv - synthetic freight demand used as an optimizer penalty.
8. asset_master.csv and department_resources.csv - availability/impact and finite crew capacity inputs.

Core pipeline:
Input Data -> CP-SAT Optimizer -> Candidate Plans -> Railway Simulator
-> 1,000 Scenarios -> Risk Evaluation -> Best Plan -> Explanation/Repair

Important:
- Maintenance departments represented here: Engineering, Signalling, Traction.
- The dataset intentionally contains overlapping maintenance windows so
  the optimizer can demonstrate both conflicts and bundling opportunities.
- scenarios.csv is reproducible from seed 42.

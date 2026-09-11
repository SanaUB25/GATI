# RAILVISTA Project Structure

**Project:** RAILVISTA
**Purpose:** Enterprise project structure for the AI-powered Railway Maintenance Block Planning and Decision Support System
**Status:** Structure specification only; implementation files are intentionally not included
**Source of truth:** `docs/RAILVISTA_ARCHITECTURE.md`

## 1. Structure principles

- `frontend/` owns the React user experience and browser-safe API clients.
- `backend/` owns identity, authorization, API contracts, workflow orchestration, persistence, audit, and integration boundaries.
- `ai-engine/` owns deterministic priority, bundling, conflict validation, CP-SAT optimization, simulation, risk, GATI, repair, and grounded Gemini assistance.
- Google OR-Tools CP-SAT is the only optimization engine.
- Gemini is an explanation and reporting dependency only. It cannot create, modify, approve, or repair schedules.
- `dataset/` contains synthetic and approved non-production fixtures only. Operational exports never enter Git.
- `tests/` contains cross-service tests; service-local tests remain close to their owning service.
- `docker/` contains local and deployment container assets. Infrastructure-as-code remains under `infra/`.
- Shared contracts and constants are versioned so Node.js, Python, and React agree on names and states.
- Approved plans, execution events, calibration versions, and audit events are immutable from application interfaces.

## 2. Complete directory tree

```text
RAILVISTA/
|
+-- frontend/
|   +-- public/
|   |   +-- favicon.ico
|   |   +-- manifest.webmanifest
|   |   `-- robots.txt
|   +-- src/
|       +-- app/
|       |   +-- App.jsx
|       |   +-- router.jsx
|       |   +-- providers.jsx
|       |   `-- routeGuards.jsx
|       +-- assets/
|       |   +-- icons/
|       |   +-- images/
|       |   +-- fonts/
|       |   `-- data/
|       +-- components/
|       |   +-- common/
|       |   +-- layout/
|       |   +-- forms/
|       |   +-- tables/
|       |   +-- charts/
|       |   +-- timeline/
|       |   +-- status/
|       |   `-- accessibility/
|       +-- pages/
|       |   +-- auth/
|       |   +-- command-overview/
|       |   +-- demand-quality/
|       |   +-- plan-comparison/
|       |   +-- plan-detail/
|       |   +-- scenario-explorer/
|       |   +-- disruption-repair/
|       |   +-- execution-feedback/
|       |   +-- administration/
|       |   `-- errors/
|       +-- features/
|       |   +-- authentication/
|       |   +-- planning-runs/
|       |   +-- maintenance-demand/
|       |   +-- plan-approval/
|       |   +-- disruptions/
|       |   +-- explanations/
|       |   `-- execution-events/
|       +-- api/
|       |   +-- client.js
|       |   +-- authApi.js
|       |   +-- importsApi.js
|       |   +-- tasksApi.js
|       |   +-- planningRunsApi.js
|       |   +-- plansApi.js
|       |   +-- disruptionsApi.js
|       |   +-- explanationsApi.js
|       |   +-- executionEventsApi.js
|       |   `-- reportsApi.js
|       +-- context/
|       |   +-- AuthContext.jsx
|       |   +-- PlanningContext.jsx
|       |   +-- NotificationContext.jsx
|       |   `-- AccessibilityContext.jsx
|       +-- hooks/
|       |   +-- useAuth.js
|       |   +-- usePermissions.js
|       |   +-- usePlanningRun.js
|       |   +-- usePlanComparison.js
|       |   +-- useScenarioResults.js
|       |   +-- useDisruptionRepair.js
|       |   +-- useExecutionFeedback.js
|       |   +-- useDebouncedQuery.js
|       |   `-- usePolling.js
|       +-- constants/
|       |   +-- routes.js
|       |   +-- roles.js
|       |   +-- runStates.js
|       |   +-- departments.js
|       |   `-- displayLabels.js
|       +-- utils/
|       |   +-- dateTime.js
|       |   +-- formatting.js
|       |   +-- permissions.js
|       |   +-- validation.js
|       |   +-- download.js
|       |   `-- chartAccessibility.js
|       +-- styles/
|       |   +-- index.css
|       |   +-- tokens.css
|       |   `-- print.css
|       `-- main.jsx
|   +-- package.json
|   +-- package-lock.json
|   +-- vite.config.js
|   +-- tailwind.config.js
|   +-- postcss.config.js
|   +-- eslint.config.js
|   `-- .env.example
|
+-- backend/
|   +-- src/
|       +-- app.js
|       +-- server.js
|       +-- config/
|       |   +-- env.js
|       |   +-- database.js
|       |   +-- queue.js
|       |   +-- logger.js
|       |   `-- security.js
|       +-- constants/
|       |   +-- departments.js
|       |   +-- roles.js
|       |   +-- runStates.js
|       |   +-- planStates.js
|       |   +-- eventTypes.js
|       |   `-- errorCodes.js
|       +-- models/
|       |   +-- User.js
|       |   +-- Role.js
|       |   +-- Corridor.js
|       |   +-- Asset.js
|       |   +-- MaintenanceTask.js
|       |   +-- BlockWindow.js
|       |   +-- Timetable.js
|       |   +-- GoodsForecast.js
|       |   +-- PlanningRun.js
|       |   +-- Plan.js
|       |   +-- Scenario.js
|       |   +-- RiskMetrics.js
|       |   +-- Disruption.js
|       |   +-- ExecutionEvent.js
|       |   +-- CalibrationVersion.js
|       |   +-- AuditEvent.js
|       |   `-- Import.js
|       +-- controllers/
|       |   +-- authController.js
|       |   +-- importController.js
|       |   +-- taskController.js
|       |   +-- planningRunController.js
|       |   +-- planController.js
|       |   +-- disruptionController.js
|       |   +-- explanationController.js
|       |   +-- executionEventController.js
|       |   `-- reportController.js
|       +-- routes/
|       |   +-- authRoutes.js
|       |   +-- importRoutes.js
|       |   +-- taskRoutes.js
|       |   +-- planningRunRoutes.js
|       |   +-- planRoutes.js
|       |   +-- disruptionRoutes.js
|       |   +-- explanationRoutes.js
|       |   +-- executionEventRoutes.js
|       |   +-- reportRoutes.js
|       |   `-- healthRoutes.js
|       +-- middleware/
|       |   +-- authenticate.js
|       |   +-- authorize.js
|       |   +-- validateRequest.js
|       |   +-- requestId.js
|       |   +-- errorHandler.js
|       |   +-- rateLimiter.js
|       |   +-- uploadSecurity.js
|       |   `-- auditRequest.js
|       +-- services/
|       |   +-- authService.js
|       |   +-- importService.js
|       |   +-- dataQualityService.js
|       |   +-- planningRunService.js
|       |   +-- planService.js
|       |   +-- disruptionService.js
|       |   +-- executionService.js
|       |   +-- explanationService.js
|       |   +-- reportService.js
|       |   +-- auditService.js
|       |   +-- calibrationService.js
|       |   `-- aiEngineClient.js
|       +-- jobs/
|       |   +-- planningRunWorker.js
|       |   +-- importWorker.js
|       |   +-- reportWorker.js
|       |   +-- calibrationWorker.js
|       |   `-- jobEvents.js
|       +-- integrations/
|       |   +-- tms/
|       |   |   +-- tmsClient.js
|       |   |   `-- tmsMapper.js
|       |   +-- smms/
|       |   |   +-- smmsClient.js
|       |   |   `-- smmsMapper.js
|       |   +-- tdms/
|       |   |   +-- tdmsClient.js
|       |   |   `-- tdmsMapper.js
|       |   +-- coa/
|       |   |   +-- coaClient.js
|       |   |   `-- coaMapper.js
|       |   +-- timetable/
|       |   |   +-- timetableClient.js
|       |   |   `-- timetableMapper.js
|       |   `-- goodsForecast/
|       |       +-- goodsForecastClient.js
|       |       `-- goodsForecastMapper.js
|       +-- repositories/
|       |   +-- userRepository.js
|       |   +-- taskRepository.js
|       |   +-- planningRunRepository.js
|       |   +-- planRepository.js
|       |   +-- scenarioRepository.js
|       |   +-- executionRepository.js
|       |   `-- auditRepository.js
|       +-- schemas/
|       |   +-- authSchemas.js
|       |   +-- importSchemas.js
|       |   +-- planningSchemas.js
|       |   +-- disruptionSchemas.js
|       |   `-- executionSchemas.js
|       +-- utils/
|       |   +-- asyncHandler.js
|       |   +-- pagination.js
|       |   +-- redaction.js
|       |   +-- retry.js
|       |   +-- correlation.js
|       |   +-- clock.js
|       |   `-- immutableVersion.js
|       `-- tests/
|           +-- unit/
|           +-- integration/
|           `-- contract/
|   +-- package.json
|   +-- package-lock.json
|   +-- eslint.config.js
|   +-- .env.example
|   `-- README.md
|
+-- ai-engine/
|   +-- app/
|   |   +-- main.py
|   |   +-- api/
|   |   |   +-- routes.py
|   |   |   +-- dependencies.py
|   |   |   `-- errors.py
|   |   +-- config/
|   |   |   +-- settings.py
|   |   |   +-- logging.py
|   |   |   `-- feature_flags.py
|   |   `-- lifecycle.py
|   +-- domain/
|   |   +-- entities.py
|   |   +-- enums.py
|   |   +-- value_objects.py
|   |   +-- planning_contracts.py
|   |   `-- policy_contracts.py
|   +-- services/
|   |   +-- priority_engine.py
|   |   +-- bundle_engine.py
|   |   +-- conflict_detector.py
|   |   +-- optimizer.py
|   |   +-- scenario_generator.py
|   |   +-- scenario_simulator.py
|   |   +-- consequence_simulator.py
|   |   +-- risk_analysis.py
|   |   +-- gati.py
|   |   +-- repair.py
|   |   +-- calibration.py
|   |   +-- gemini_service.py
|   |   `-- prompt_builder.py
|   +-- repositories/
|   |   +-- planning_repository.py
|   |   +-- calibration_repository.py
|   |   `-- artifact_repository.py
|   +-- schemas/
|   |   +-- requests.py
|   |   +-- responses.py
|   |   +-- scenario_schemas.py
|   |   `-- evidence_schemas.py
|   +-- utils/
|   |   +-- random_state.py
|   |   +-- statistics.py
|   |   +-- time_windows.py
|   |   +-- serialization.py
|   |   `-- redaction.py
|   +-- tests/
|   |   +-- unit/
|   |   +-- property/
|   |   +-- integration/
|   |   `-- fixtures/
|   +-- pyproject.toml
|   +-- requirements.txt
|   +-- requirements-dev.txt
|   +-- .env.example
|   `-- README.md
|
+-- dataset/
|   +-- README.md
|   +-- schemas/
|   |   +-- canonical-task.schema.json
|   |   +-- corridor.schema.json
|   |   +-- block-window.schema.json
|   |   +-- timetable.schema.json
|   |   `-- goods-forecast.schema.json
|   +-- synthetic/
|   |   +-- tms/
|   |   +-- smms/
|   |   +-- tdms/
|   |   +-- coa/
|   |   +-- timetable/
|   |   `-- goods-forecast/
|   +-- calibration/
|   |   +-- distributions/
|   |   `-- historical-aggregates/
|   `-- manifests/
|       +-- demo-manifest.json
|       `-- dataset-versions.json
|
+-- docs/
|   +-- RAILVISTA_ARCHITECTURE.md
|   +-- RAILVISTA_PROJECT_STRUCTURE.md
|   +-- api/
|   |   +-- openapi.yaml
|   |   `-- error-catalog.md
|   +-- adr/
|   |   +-- 0001-service-boundaries.md
|   |   +-- 0002-cp-sat-as-optimizer.md
|   |   +-- 0003-gemini-explainability-boundary.md
|   |   +-- 0004-mongodb-snapshot-storage.md
|   |   `-- 0005-human-approval-gate.md
|   +-- operations/
|   |   +-- deployment-runbook.md
|   |   +-- incident-runbook.md
|   |   +-- backup-restore-runbook.md
|   |   `-- calibration-runbook.md
|   +-- security/
|   |   +-- threat-model.md
|   |   +-- data-classification.md
|   |   `-- access-control-matrix.md
|   `-- demo/
|       +-- presentation-script.md
|       `-- demo-checklist.md
|
+-- tests/
|   +-- contract/
|   |   +-- openapi-contract.test.js
|   |   `-- ai-engine-contract.test.py
|   +-- integration/
|   |   +-- planning-workflow.test.js
|   |   +-- repair-workflow.test.js
|   |   `-- feedback-workflow.test.js
|   +-- e2e/
|   |   +-- authentication.spec.js
|   |   +-- plan-comparison.spec.js
|   |   +-- approval.spec.js
|   |   `-- disruption-repair.spec.js
|   +-- performance/
|   |   +-- dashboard-load.js
|   |   +-- planning-throughput.js
|   |   `-- simulation-throughput.js
|   +-- security/
|   |   +-- authorization.test.js
|   |   +-- input-validation.test.js
|   |   `-- dependency-policy.test.js
|   `-- fixtures/
|       +-- corridor-small/
|       +-- corridor-medium/
|       `-- disruption-cases/
|
+-- docker/
|   +-- backend.Dockerfile
|   +-- frontend.Dockerfile
|   +-- ai-engine.Dockerfile
|   +-- docker-compose.yml
|   +-- docker-compose.test.yml
|   +-- nginx.conf
|   `-- healthchecks/
|       +-- backend-health.ps1
|       `-- ai-engine-health.ps1
|
+-- infra/
|   +-- k8s/
|   +-- terraform/
|   +-- monitoring/
|   `-- README.md
|
+-- scripts/
|   +-- validate-structure.ps1
|   +-- seed-demo-data.ps1
|   +-- run-local.ps1
|   +-- run-tests.ps1
|   +-- export-report.ps1
|   `-- check-environment.ps1
|
+-- shared/
|   +-- constants/
|   |   +-- departments.json
|   |   +-- roles.json
|   |   +-- run-states.json
|   |   +-- plan-states.json
|   |   +-- event-types.json
|   |   `-- units.json
|   +-- schemas/
|   |   +-- canonical-task.schema.json
|   |   +-- planning-run.schema.json
|   |   +-- plan.schema.json
|   |   +-- risk-metrics.schema.json
|   |   `-- execution-event.schema.json
|   +-- openapi/
|   |   `-- railvista.openapi.yaml
|   `-- README.md
|
+-- .env.example
+-- .gitignore
+-- CONTRIBUTING.md
+-- README.md
+-- SECURITY.md
+-- package.json
`-- LICENSE
```

The tree is a target repository layout. Directories and source files are not implementation deliverables for this phase.

## 3. Root-level files and folders

| Path | Explanation |
|---|---|
| `frontend/` | React and Tailwind dashboard application. |
| `backend/` | Node.js and Express application boundary. |
| `ai-engine/` | FastAPI-based Python planning and analytics service. |
| `dataset/` | Versioned synthetic/demo data and approved calibration aggregates. |
| `docs/` | Architecture, API, operational, security, and demo documentation. |
| `tests/` | Cross-service contract, integration, end-to-end, performance, and security tests. |
| `docker/` | Container definitions and local orchestration. |
| `infra/` | Deployment and monitoring infrastructure definitions. |
| `scripts/` | Safe, repeatable local development and validation commands. |
| `shared/` | Language-neutral schemas, OpenAPI contracts, and shared enumerations. |
| `.env.example` | Documented root configuration keys without secrets. |
| `.gitignore` | Excludes secrets, build output, logs, local data, and production exports. |
| `README.md` | Project entry point, setup sequence, architecture links, and demo instructions. |
| `CONTRIBUTING.md` | Review, testing, naming, and branch contribution rules. |
| `SECURITY.md` | Vulnerability reporting and security handling policy. |
| `package.json` | Root workspace scripts only; service dependencies remain local to each service. |

## 4. Backend structure

### Configuration

- `config/env.js`: validates required environment variables at startup.
- `config/database.js`: MongoDB client, pool, retry, and lifecycle configuration.
- `config/queue.js`: queue connection and worker configuration.
- `config/logger.js`: structured logging and redaction policy.
- `config/security.js`: token, cookie, CORS, upload, and security-header policy.

### Models

Models represent MongoDB collections defined by the architecture: users, roles, corridors, assets, maintenance tasks, block windows, timetables, goods forecasts, planning runs, plans, scenarios, risk metrics, disruptions, execution events, calibration versions, audit events, and imports.

Model files own persistence shape, indexes, immutable-field rules, and references. They do not contain CP-SAT or Gemini logic.

### Controllers and routes

Controllers translate HTTP requests into service calls and return the standard `{data, meta}` envelope. Routes declare paths and middleware composition. Business rules remain in services.

The route groups are:

- `authRoutes.js`: login, refresh, logout, and identity endpoints.
- `importRoutes.js`: source import creation and import status.
- `taskRoutes.js`: canonical task filtering and detail access.
- `planningRunRoutes.js`: planning run creation, status, and plan listing.
- `planRoutes.js`: plan detail, approval, and version checks.
- `disruptionRoutes.js`: incident creation and affected-plan operations.
- `explanationRoutes.js`: evidence-grounded explanation requests.
- `executionEventRoutes.js`: actual operational outcomes.
- `reportRoutes.js`: generated report retrieval.
- `healthRoutes.js`: liveness and readiness checks; health endpoints do not expose secrets.

### Middleware

Authentication verifies identity. Authorization verifies role and corridor/department scope. Request validation applies shared schemas. Request IDs and audit middleware preserve traceability. Upload security checks file type, size, source, and quarantine status. The error handler maps failures to the documented RFC 7807-shaped response.

### Services and jobs

Services coordinate use cases and repositories. They do not bypass approval gates or mutate immutable records. Jobs handle asynchronous imports, planning runs, reports, and calibration. A planning job sends a versioned snapshot to FastAPI and persists returned artifacts by `runId`.

### Integrations

Each source adapter has a client and mapper. The client handles transport and authentication; the mapper converts TMS, SMMS, TDMS, COA, timetable, and goods forecast records into canonical shared schemas. Adapters never make planning decisions.

## 5. AI engine structure

FastAPI is the selected Python boundary because it provides typed request/response contracts, asynchronous HTTP handling, automatic OpenAPI generation, and a natural fit for numerical worker services.

- `app/main.py`: FastAPI application entry point.
- `app/api/routes.py`: health, planning, simulation, repair, and explanation-facing service routes.
- `app/config/`: environment-backed settings, logging, and feature flags.
- `domain/`: railway entities, enums, value objects, and planning contracts.
- `services/priority_engine.py`: deterministic priority score from criticality, severity, overdue duration, weather risk, and asset importance.
- `services/bundle_engine.py`: proposes cross-department bundles subject to compatibility rules.
- `services/conflict_detector.py`: independent safety, resource, track, and time validation.
- `services/optimizer.py`: Google OR-Tools CP-SAT model, feasible-plan generation, diversity cuts, and solver metadata.
- `services/scenario_generator.py`: seeded, versioned scenario sampling and correlation handling.
- `services/scenario_simulator.py`: evaluates each plan against generated scenarios.
- `services/consequence_simulator.py`: calculates delay, cascade, cancellation, and emergency consequences.
- `services/risk_analysis.py`: mean, P95, CVaR10, cascade probability, emergency rate, and confidence information.
- `services/gati.py`: applies `GATI = 0.6 * MeanDelay + 0.4 * CVaR10Delay`.
- `services/repair.py`: fixes completed/in-progress work and reoptimizes only the remaining movable schedule.
- `services/calibration.py`: compares predicted and actual outcomes and produces governed calibration candidates.
- `services/gemini_service.py`: calls Gemini only with persisted evidence and approved policy context.
- `services/prompt_builder.py`: redacts and structures evidence-only prompts.
- `repositories/`: persistence and artifact interfaces; no direct browser concerns.
- `schemas/`: Pydantic contracts for requests, responses, scenarios, and explainability evidence.
- `utils/`: seeded randomness, statistics, time windows, serialization, and redaction helpers.

## 6. Frontend structure

### Application and providers

- `app/App.jsx`: application shell.
- `app/router.jsx`: route declarations.
- `app/providers.jsx`: Auth, planning, notification, and accessibility providers.
- `app/routeGuards.jsx`: role and authenticated-route protection.

### Pages

- `auth/`: sign-in and session-expiry views.
- `command-overview/`: corridor status, active run, recommendation, and alerts.
- `demand-quality/`: departmental demand, import status, and validation rejects.
- `plan-comparison/`: Plan A/B/C comparison using GATI, mean, P95, CVaR10, coverage, and utilization.
- `plan-detail/`: block timeline, assigned tasks, resources, constraints, and approval state.
- `scenario-explorer/`: scenario distribution, tail cases, cascade count, and emergency outcomes.
- `disruption-repair/`: disruption input and frozen-versus-movable repair view.
- `execution-feedback/`: predicted-versus-actual outcomes and calibration status.
- `administration/`: users, roles, source connections, configuration versions, and audit access.
- `errors/`: unauthorized, not-found, service-unavailable, and generic failure states.

### Components, assets, API, hooks, and context

`components/` contains reusable visual units, not page-specific business workflows. Charts use accessible labels and do not rely on colour alone. `timeline/` owns stable Gantt/timeline dimensions. `assets/` contains approved icons, fonts, imagery, and static demo data. `api/` contains browser clients grouped by backend resource. `hooks/` contains reusable data-fetching and interaction logic. `context/` contains genuinely cross-page state; local page state remains local.

Tailwind configuration and CSS tokens define the visual system. Production assets must not contain real operational data, credentials, or unapproved railway marks.

## 7. Shared constants and contracts

Shared constants are language-neutral JSON files under `shared/constants/`, with typed adapters in each service. They include:

- Departments: `ENGINEERING`, `SNT`, `TRD`.
- Roles: `CONTROL_OFFICER`, `ENGINEERING_OFFICER`, `SNT_OFFICER`, `TRD_OFFICER`, `ADMIN`.
- Run states: `QUEUED`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`.
- Plan states: `DRAFT`, `REVIEW`, `APPROVED`, `PUBLISHED`, `EXECUTING`, `COMPLETED`, `REPAIRED`.
- Event types: import, validation, planning, approval, publication, disruption, repair, execution, calibration, and explanation.
- Units: minutes, kilometres, counts, probability, and score.

Shared schemas define canonical task, planning run, plan, risk metric, and execution-event payloads. OpenAPI is authoritative for HTTP contracts. A schema version is required whenever a backward-incompatible field or meaning changes.

## 8. Utils folder responsibilities

Utilities must be small, deterministic, and domain-neutral where possible:

- Date/time utilities convert IST input to UTC storage and format authorized display values.
- Pagination utilities enforce bounded page sizes.
- Retry utilities handle transient dependency failures with capped exponential backoff.
- Redaction utilities remove secrets, tokens, PII, and restricted timetable fields from logs and Gemini prompts.
- Correlation utilities propagate `requestId`, `runId`, and `planId`.
- Random-state utilities make simulations reproducible from an explicit seed.
- Statistics utilities implement validated percentile and CVaR calculations.
- Serialization utilities preserve decimal precision and schema versions.

No utility may silently weaken a safety constraint, alter an approved plan, or hide an error.

## 9. Dataset structure

Only synthetic data and approved aggregate calibration data belong in `dataset/`. Source-shaped folders mirror TMS, SMMS, TDMS, COA, timetable, and goods forecast inputs. Every fixture is versioned by a manifest, schema, generation date, and sensitivity classification.

Historical operational records must be de-identified, aggregated, access-controlled, and stored outside Git. Dataset validation must run before a fixture is used by a demo, test, or calibration job.

## 10. Testing structure

- `backend/src/tests/unit/`: controller, service, middleware, and repository unit tests.
- `backend/src/tests/integration/`: MongoDB, queue, adapter, and service integration tests.
- `backend/src/tests/contract/`: API contract tests against OpenAPI.
- `ai-engine/tests/unit/`: priority, conflict, risk, GATI, and repair tests.
- `ai-engine/tests/property/`: invariants such as no unsafe generated plan and reproducible seeded simulation.
- `ai-engine/tests/integration/`: FastAPI and planning pipeline tests.
- `tests/contract/`: Node/Python cross-service compatibility.
- `tests/integration/`: end-to-end planning, repair, and feedback workflows.
- `tests/e2e/`: browser workflows for login, comparison, approval, and repair.
- `tests/performance/`: dashboard latency, planning throughput, and simulation throughput.
- `tests/security/`: RBAC, input validation, dependency policy, and token/session controls.
- `tests/fixtures/`: small, medium, disruption, and invalid-data scenarios.

Safety property tests are mandatory for every optimizer change. Tests must report solver status, seed, configuration version, and fixture version.

## 11. Docker and deployment structure

- `backend.Dockerfile`: minimal Node.js API image.
- `frontend.Dockerfile`: frontend build image and static-serving runtime.
- `ai-engine.Dockerfile`: FastAPI runtime with numerical dependencies.
- `docker-compose.yml`: local API, frontend, AI engine, MongoDB, and queue topology.
- `docker-compose.test.yml`: isolated test dependencies and ephemeral data.
- `nginx.conf`: local/static routing and security headers where required.
- `healthchecks/`: non-secret liveness and readiness checks.

Production deployment artifacts belong under `infra/k8s`, `infra/terraform`, and `infra/monitoring`. Docker Compose is for development and demo use, not production high availability.

## 12. Configuration files

Required configuration surfaces are:

- Frontend build configuration: `package.json`, `vite.config.js`, `tailwind.config.js`, `postcss.config.js`, `eslint.config.js`.
- Backend runtime configuration: `package.json`, `eslint.config.js`, `config/env.js`, and `.env.example`.
- AI engine configuration: `pyproject.toml`, `requirements.txt`, `requirements-dev.txt`, and `.env.example`.
- Shared API configuration: `shared/openapi/railvista.openapi.yaml`.
- Container configuration: Dockerfiles and Compose files.
- Deployment configuration: Kubernetes/Terraform/monitoring files under `infra/`.

Configuration is externalized. Secrets are never committed, embedded in images, returned in health responses, or sent to the browser.

## 13. Environment variables

The root `.env.example` documents names and safe example values only. Actual values are supplied by the deployment environment or secret manager.

| Variable | Owner | Purpose |
|---|---|---|
| `NODE_ENV` | backend | runtime environment |
| `PORT` | backend | Express listen port |
| `MONGODB_URI` | backend/AI engine | MongoDB connection |
| `MONGODB_DATABASE` | backend/AI engine | database name |
| `MONGODB_MAX_POOL_SIZE` | backend | connection pool limit |
| `QUEUE_URL` | backend/AI engine | job queue connection |
| `AI_ENGINE_BASE_URL` | backend | FastAPI service address |
| `JWT_ACCESS_SECRET` | backend | access-token signing secret |
| `JWT_REFRESH_SECRET` | backend | refresh-token signing secret |
| `JWT_ACCESS_TTL` | backend | access-token lifetime |
| `CORS_ORIGINS` | backend | approved frontend origins |
| `UPLOAD_MAX_BYTES` | backend | import upload limit |
| `GEMINI_API_KEY` | AI engine | Gemini credential, secret-managed |
| `GEMINI_MODEL` | AI engine | approved Gemini model identifier |
| `GEMINI_TIMEOUT_MS` | AI engine | bounded explanation timeout |
| `GEMINI_ENABLED` | AI engine | feature flag; planning never depends on it |
| `SCENARIO_COUNT_DEFAULT` | AI engine | default 1,000 scenarios |
| `SIMULATION_BASE_SEED` | AI engine | reproducibility policy seed |
| `SOLVER_TIME_LIMIT_SECONDS` | AI engine | CP-SAT solve budget |
| `CALIBRATION_VERSION` | AI engine | active governed distribution set |
| `VITE_API_BASE_URL` | frontend | backend API base URL |
| `LOG_LEVEL` | all services | structured log level |
| `OTEL_EXPORTER_ENDPOINT` | all services | optional trace exporter |

## 14. Naming conventions

- Use `camelCase` for JavaScript variables, functions, API JSON fields, and MongoDB collection fields.
- Use `PascalCase` for React components, JavaScript classes, and MongoDB model constructors.
- Use `snake_case` for Python modules, functions, and variables.
- Use `PascalCase` for Python classes and Pydantic models.
- Use kebab-case for URL path segments, except established resource names where the API contract already defines the path.
- Use singular PascalCase model filenames: `MaintenanceTask.js`, `PlanningRun.js`.
- Use plural route filenames: `planningRunRoutes.js` is the established JavaScript route convention.
- Use `SCREAMING_SNAKE_CASE` for enum values and environment variable names.
- Use UUID/string IDs with explicit prefixes only where the API contract defines them, such as `run_` and `plan_`.
- Use UTC for persisted timestamps and ISO 8601 strings at API boundaries.
- Name tests after the behavior under test, for example `gati.test.py` and `approval.spec.js`.
- Names must use `SNT` consistently for Signal and Telecommunication and `TRD` consistently for Traction Distribution.

## 15. Git branch strategy

- `main`: protected production-ready branch.
- `develop`: optional integration branch for a multi-team delivery phase.
- `feature/<ticket>-<short-name>`: short-lived feature work.
- `fix/<ticket>-<short-name>`: ordinary defect fixes.
- `hotfix/<ticket>-<short-name>`: urgent production corrections.
- `docs/<ticket>-<short-name>`: documentation-only changes.
- `release/<version>`: release hardening and final verification.

Pull requests require focused tests, lint/type checks, security scanning, an owner review, and no committed secrets. Optimizer, conflict-rule, GATI, calibration, or safety changes additionally require Operations Research and railway-domain review. Schema and API changes require contract-test updates. Merge commits and direct pushes to `main` are prohibited.

## 16. Documentation map

- `RAILVISTA_ARCHITECTURE.md`: system architecture, workflows, algorithms, APIs, security, and demo strategy.
- `RAILVISTA_PROJECT_STRUCTURE.md`: this repository layout and ownership specification.
- `api/openapi.yaml`: machine-readable HTTP contract.
- `adr/`: decisions that must not be silently redesigned.
- `operations/`: deployment, incident, restore, and calibration procedures.
- `security/`: threat model, data classification, and access-control matrix.
- `demo/`: presentation and deterministic demo execution material.

## 17. Ownership summary

| Area | Primary owner | Review partners |
|---|---|---|
| React dashboard | MERN developer | Product Manager, Control Officer |
| Express API and MongoDB | MERN developer / Data Engineer | Principal Architect, DevOps |
| FastAPI contracts | Python Backend Architect | MERN developer |
| CP-SAT optimizer | Operations Research Engineer | Railway Operations Expert |
| Scenario and calibration models | AI Research Scientist | Operations Research Engineer |
| Source adapters and canonical data | Data Engineer | Department officers |
| Security and deployment | DevOps Engineer | Principal Architect |
| Architecture and ADRs | Principal Software Architect | Entire engineering team |
| User acceptance and railway rules | Railway Operations Expert | Department officers |
| Documentation and demo | Technical Documentation Specialist / Product Manager | Entire team |

## 18. Scope boundary for this phase

This deliverable defines folders, files, ownership, contracts, configuration surfaces, and repository conventions only. It intentionally does not generate React components, Express handlers, FastAPI routes, database implementations, optimizer code, simulation code, Docker images, or deployment manifests.

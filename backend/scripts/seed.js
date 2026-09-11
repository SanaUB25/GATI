import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import fs from 'node:fs/promises';
import path from 'node:path';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { env } from '../src/config/env.js';
import { User } from '../src/models/User.js';
import { MaintenanceTask } from '../src/models/MaintenanceTask.js';
import { DatasetImport, Network, Scenario, Station, Train } from '../src/models/RailwayData.js';

const headers = { 'maintenance_jobs.csv': ['id', 'section', 'department', 'duration', 'earliest_start', 'latest_end', 'priority', 'committed', 'defect_type', 'season', 'severity', 'urgency', 'overdue', 'weather_factor'], 'network.csv': ['section_id', 'from_station', 'to_station', 'single_line', 'capacity'], 'stations.csv': ['station_id', 'name'], 'trains.csv': ['id', 'route', 'departure', 'arrival', 'priority', 'rake_id'], 'scenarios.csv': ['scenario_id', 'train_delay', 'maintenance_overrun', 'traffic_factor', 'asset_risk'] };
function parseCsv(text) { const rows = []; let row = [], value = '', quoted = false; for (let i = 0; i < text.length; i += 1) { const char = text[i]; if (char === '"') { if (quoted && text[i + 1] === '"') { value += '"'; i += 1; } else quoted = !quoted; } else if (char === ',' && !quoted) { row.push(value); value = ''; } else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\r' && text[i + 1] === '\n') i += 1; row.push(value); if (row.some(Boolean)) rows.push(row); row = []; value = ''; } else value += char; } if (value || row.length) { row.push(value); rows.push(row); } return rows; }
async function readDataset(name) { const rows = parseCsv(await fs.readFile(path.join(env.dataDir, name), 'utf8')); if (rows.length < 2 || rows[0].join(',') !== headers[name].join(',')) throw new Error(`${name} has unexpected headers`); return rows.slice(1).map((row) => Object.fromEntries(rows[0].map((header, index) => [header, row[index]]))); }
async function insertMissing(Model, docs, key) { const values = docs.map((doc) => doc[key]); const found = await Model.find({ [key]: { $in: values } }).select(key).lean(); const existing = new Set(found.map((doc) => doc[key])); const missing = docs.filter((doc) => !existing.has(doc[key])); if (missing.length) await Model.insertMany(missing, { ordered: false }); return missing.length; }
const number = (value) => Number(value);
const department = { Engineering: 'ENGINEERING', Signalling: 'SNT', Traction: 'TRD' };

try {
  const [maintenanceRows, networkRows, stationRows, trainRows, scenarioRows] = await Promise.all(Object.keys(headers).map(readDataset));
  await connectDatabase();
  await User.updateOne({ email: 'control@railvista.local' }, { $setOnInsert: { name: 'Control Officer', passwordHash: await bcrypt.hash('password123', 12), role: 'CONTROL_OFFICER' } }, { upsert: true });
  const counts = {};
  counts.stations = await insertMissing(Station, stationRows.map((row) => ({ stationId: row.station_id, name: row.name })), 'stationId');
  counts.network = await insertMissing(Network, networkRows.map((row) => ({ sectionId: row.section_id, fromStationId: row.from_station, toStationId: row.to_station, singleLine: row.single_line === 'True', capacity: number(row.capacity) })), 'sectionId');
  counts.trains = await insertMissing(Train, trainRows.map((row) => ({ trainId: row.id, route: row.route.split(','), departureMin: number(row.departure), arrivalMin: number(row.arrival), priority: row.priority, rakeId: row.rake_id })), 'trainId');
  counts.scenarios = await insertMissing(Scenario, scenarioRows.map((row) => ({ scenarioId: row.scenario_id, trainDelay: number(row.train_delay), maintenanceOverrun: number(row.maintenance_overrun), trafficFactor: number(row.traffic_factor), assetRisk: number(row.asset_risk), failureProbability: number(row.asset_risk), emergencyEvent: number(row.asset_risk) >= .75 })), 'scenarioId');
  const sectionImportance = Object.fromEntries(networkRows.map((row) => [row.section_id, row.single_line === 'True' ? 5 : 3]));
  const maintenance = maintenanceRows.map((row) => ({ sourceId: row.id, sourceSystem: row.department === 'Engineering' ? 'TMS' : row.department === 'Signalling' ? 'SMMS' : 'TDMS', department: department[row.department], corridorId: 'NDLS-KKDE', assetId: row.section, sectionId: row.section, durationMin: number(row.duration), dueAt: new Date(`2026-10-01T00:00:00Z`).getTime() + number(row.earliest_start) * 60_000, severity: number(row.severity), criticality: number(row.urgency), resources: [department[row.department]], status: 'OPEN', windowEarliestMin: number(row.earliest_start), windowLatestMin: number(row.latest_end), weatherFactor: number(row.weather_factor), season: row.season, overdueDays: row.overdue === 'True' ? 30 : 0, assetImportance: sectionImportance[row.section] || 1, priorityScore: Math.min(100, number(row.severity) * 12 + number(row.urgency) * 8 + (row.overdue === 'True' ? 15 : 0)) }));
  counts.maintenance = await insertMissing(MaintenanceTask, maintenance, 'sourceId');
  await MaintenanceTask.bulkWrite(maintenance.map((task) => ({ updateOne: { filter: { sourceId: task.sourceId }, update: { $set: task } } })));
  await Scenario.bulkWrite(scenarioRows.map((row) => ({ updateOne: { filter: { scenarioId: row.scenario_id }, update: { $set: { failureProbability: number(row.asset_risk), emergencyEvent: number(row.asset_risk) >= .75 } } } })));
  await DatasetImport.create({ status: 'COMPLETED', counts });
  console.log(`Maintenance imported: ${counts.maintenance}\nStations imported: ${counts.stations}\nNetwork imported: ${counts.network}\nTrains imported: ${counts.trains}\nScenarios imported: ${counts.scenarios}\nSeed completed successfully.`);
} catch (error) { if (mongoose.connection.readyState) await DatasetImport.create({ status: 'FAILED', detail: error.message }); console.error(`Seed failed: ${error.message}`); process.exitCode = 1; } finally { await disconnectDatabase(); }

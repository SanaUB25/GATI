import mongoose from 'mongoose';

const stationSchema = new mongoose.Schema({ stationId: { type: String, unique: true, required: true, index: true }, name: { type: String, required: true } }, { timestamps: true });
const networkSchema = new mongoose.Schema({ sectionId: { type: String, unique: true, required: true, index: true }, fromStationId: { type: String, required: true, ref: 'Station' }, toStationId: { type: String, required: true, ref: 'Station' }, singleLine: { type: Boolean, required: true }, capacity: { type: Number, min: 1, required: true } }, { timestamps: true });
const trainSchema = new mongoose.Schema({ trainId: { type: String, unique: true, required: true, index: true }, route: { type: [String], required: true }, departureMin: { type: Number, min: 0, required: true }, arrivalMin: { type: Number, min: 0, required: true }, priority: { type: String, required: true }, rakeId: { type: String, required: true } }, { timestamps: true });
const scenarioSchema = new mongoose.Schema({ scenarioId: { type: String, unique: true, required: true, index: true }, trainDelay: { type: Number, min: 0, required: true }, maintenanceOverrun: { type: Number, min: 0, required: true }, trafficFactor: { type: Number, min: 0, required: true }, assetRisk: { type: Number, min: 0, required: true }, failureProbability: { type: Number, min: 0, max: 1, required: true }, emergencyEvent: { type: Boolean, required: true } }, { timestamps: true });
const importRunSchema = new mongoose.Schema({ status: { type: String, enum: ['COMPLETED', 'FAILED'], required: true }, counts: { maintenance: Number, stations: Number, network: Number, trains: Number, scenarios: Number }, detail: String }, { timestamps: true });

export const Station = mongoose.model('Station', stationSchema);
export const Network = mongoose.model('Network', networkSchema);
export const Train = mongoose.model('Train', trainSchema);
export const Scenario = mongoose.model('Scenario', scenarioSchema);
export const DatasetImport = mongoose.model('DatasetImport', importRunSchema);

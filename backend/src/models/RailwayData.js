import mongoose from 'mongoose';

const stationSchema = new mongoose.Schema({ stationId: { type: String, unique: true, required: true, index: true }, name: { type: String, required: true } }, { timestamps: true });
const networkSchema = new mongoose.Schema({ sectionId: { type: String, unique: true, required: true, index: true }, fromStationId: { type: String, required: true, ref: 'Station' }, toStationId: { type: String, required: true, ref: 'Station' }, singleLine: { type: Boolean, required: true }, capacity: { type: Number, min: 1, required: true } }, { timestamps: true });
const trainSchema = new mongoose.Schema({ trainId: { type: String, unique: true, required: true, index: true }, route: { type: [String], required: true }, departureMin: { type: Number, min: 0, required: true }, arrivalMin: { type: Number, min: 0, required: true }, priority: { type: String, required: true }, rakeId: { type: String, required: true } }, { timestamps: true });
const scenarioSchema = new mongoose.Schema({ scenarioId: { type: String, unique: true, required: true, index: true }, trainDelay: { type: Number, min: 0, required: true }, maintenanceOverrun: { type: Number, min: 0, required: true }, trafficFactor: { type: Number, min: 0, required: true }, assetRisk: { type: Number, min: 0, required: true }, failureProbability: { type: Number, min: 0, max: 1, required: true }, emergencyEvent: { type: Boolean, required: true } }, { timestamps: true });
const coaSchema = new mongoose.Schema({ coaId: { type: String, unique: true, required: true }, date: { type: Date, required: true }, sectionId: { type: String, required: true, index: true }, corridorId: { type: String, required: true, index: true }, startMin: Number, endMin: Number, availabilityStatus: { type: String, enum: ['AVAILABLE', 'RESTRICTED', 'BLOCKED'], required: true }, capacity: { type: Number, min: 0, default: 1 }, possessionType: String, allowedDepartments: [String] }, { timestamps: true });
coaSchema.index({ sectionId: 1, date: 1, startMin: 1 });
const goodsForecastSchema = new mongoose.Schema({ forecastId: { type: String, unique: true, required: true }, date: Date, sectionId: { type: String, required: true, index: true }, startMin: Number, endMin: Number, expectedGoodsTrains: Number, trafficIntensity: String, confidence: Number, capacityDemand: Number }, { timestamps: true });
const assetSchema = new mongoose.Schema({ assetId: { type: String, unique: true, required: true }, assetType: String, department: String, sectionId: { type: String, index: true }, criticality: Number, importance: Number, currentAvailability: Number, failureImpact: Number }, { timestamps: true });
const departmentResourceSchema = new mongoose.Schema({ resourceId: { type: String, unique: true, required: true }, department: { type: String, enum: ['ENGINEERING', 'SNT', 'TRD'], index: true }, resourceType: String, capacity: { type: Number, min: 0, required: true } }, { timestamps: true });
const importRunSchema = new mongoose.Schema({ status: { type: String, enum: ['COMPLETED', 'FAILED'], required: true }, counts: mongoose.Schema.Types.Mixed, detail: String }, { timestamps: true });

export const Station = mongoose.model('Station', stationSchema);
export const Network = mongoose.model('Network', networkSchema);
export const Train = mongoose.model('Train', trainSchema);
export const Scenario = mongoose.model('Scenario', scenarioSchema);
export const CorridorAvailability = mongoose.model('CorridorAvailability', coaSchema);
export const GoodsForecast = mongoose.model('GoodsForecast', goodsForecastSchema);
export const Asset = mongoose.model('Asset', assetSchema);
export const DepartmentResource = mongoose.model('DepartmentResource', departmentResourceSchema);
export const DatasetImport = mongoose.model('DatasetImport', importRunSchema);

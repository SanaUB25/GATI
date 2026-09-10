import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDatabase, disconnectDatabase } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { MaintenanceTask } from '../src/models/MaintenanceTask.js';

await connectDatabase();
await User.deleteMany({ email: 'control@railvista.local' });
await MaintenanceTask.deleteMany({ sourceId: { $in: ['TMS-DEMO-001', 'SMMS-DEMO-001', 'TDMS-DEMO-001'] } });
await User.create({ name: 'Control Officer', email: 'control@railvista.local', passwordHash: await bcrypt.hash('password123', 12), role: 'CONTROL_OFFICER' });
await MaintenanceTask.insertMany([
  { sourceId: 'TMS-DEMO-001', sourceSystem: 'TMS', department: 'ENGINEERING', corridorId: 'NDLS-KKDE', assetId: 'TRK-101', durationMin: 90, dueAt: new Date('2026-10-02'), severity: 4, criticality: 5 },
  { sourceId: 'SMMS-DEMO-001', sourceSystem: 'SMMS', department: 'SNT', corridorId: 'NDLS-KKDE', assetId: 'SIG-201', durationMin: 60, dueAt: new Date('2026-10-03'), severity: 3, criticality: 4 },
  { sourceId: 'TDMS-DEMO-001', sourceSystem: 'TDMS', department: 'TRD', corridorId: 'NDLS-KKDE', assetId: 'OHE-301', durationMin: 75, dueAt: new Date('2026-10-04'), severity: 5, criticality: 5 }
]);
console.log('RAILVISTA demo data seeded');
await disconnectDatabase();
await mongoose.connection.close();

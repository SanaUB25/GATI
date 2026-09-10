import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }, type: { type: String, required: true }, title: { type: String, required: true }, message: { type: String, required: true }, readAt: Date }, { timestamps: true });
const auditLogSchema = new mongoose.Schema({ actorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, action: { type: String, required: true }, entityType: { type: String, required: true }, entityId: String, requestId: String, metadata: mongoose.Schema.Types.Mixed }, { timestamps: true });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
const departmentSchema = new mongoose.Schema({ code: { type: String, enum: ['ENGINEERING', 'SNT', 'TRD'], unique: true }, name: { type: String, required: true }, active: { type: Boolean, default: true } });
const roleSchema = new mongoose.Schema({ code: { type: String, unique: true }, name: String, permissions: [String] });
export const Notification = mongoose.model('Notification', notificationSchema);
export const AuditLog = mongoose.model('AuditLog', auditLogSchema);
export const Department = mongoose.model('Department', departmentSchema);
export const Role = mongoose.model('Role', roleSchema);

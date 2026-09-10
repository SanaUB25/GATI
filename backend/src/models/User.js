import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['CONTROL_OFFICER', 'ENGINEERING_OFFICER', 'SNT_OFFICER', 'TRD_OFFICER', 'ADMIN'], required: true },
  department: { type: String, enum: ['ENGINEERING', 'SNT', 'TRD', null], default: null },
  active: { type: Boolean, default: true }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);

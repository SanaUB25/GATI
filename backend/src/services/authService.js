import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

export async function login(email, password) {
  const user = await User.findOne({ email: email.toLowerCase(), active: true }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    const error = new Error('Invalid credentials'); error.statusCode = 401; throw error;
  }
  const token = jwt.sign({ sub: user.id, role: user.role, department: user.department }, env.jwtSecret, { expiresIn: env.jwtTtl });
  return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, department: user.department } };
}

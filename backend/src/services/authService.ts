import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { userRepository } from '../repositories/userRepository';
import { AuthPayload } from '../middleware/auth';

export const authService = {
  async login(username: string, password: string) {
    const user = await userRepository.findByUsername(username);

    if (!user || !user.isActive) {
      throw new Error('Credenciales inválidas');
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    const roles = user.roles.map(ur => ur.role.name);

    const payload: AuthPayload = {
      userId: user.id,
      username: user.username,
      email: user.email,
      roles
    };

    const secret = process.env.JWT_SECRET || 'default-secret';
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

    const token = jwt.sign(payload, secret, { expiresIn });

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        roles,
        branch: user.branch
      }
    };
  },

  async getMe(userId: number) {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const roles = user.roles.map(ur => ur.role.name);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      fullName: user.fullName,
      roles,
      branch: user.branch,
      isActive: user.isActive
    };
  }
};


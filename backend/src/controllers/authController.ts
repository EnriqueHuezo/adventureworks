import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { authService } from '../services/authService';

const loginSchema = z.object({
  username: z.string().min(1, 'Usuario requerido'),
  password: z.string().min(1, 'Contraseña requerida')
});

export const authController = {
  async login(req: AuthRequest, res: Response) {
    try {
      const { username, password } = loginSchema.parse(req.body);
      const result = await authService.login(username, password);
      res.json(result);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      res.status(401).json({ error: error.message || 'Error de autenticación' });
    }
  },

  async getMe(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }
      const user = await authService.getMe(req.user.userId);
      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};


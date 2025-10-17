import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthPayload {
  userId: number;
  username: string;
  email: string;
  roles: string[];
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de autenticación requerido' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'default-secret';
    const payload = jwt.verify(token, secret) as AuthPayload;
    req.user = payload;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
}


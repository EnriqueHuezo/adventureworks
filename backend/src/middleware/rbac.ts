import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export function requireRole(...allowedRoles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const hasRole = req.user.roles.some(role => allowedRoles.includes(role));

    if (!hasRole) {
      return res.status(403).json({ 
        error: 'No tiene permisos suficientes para realizar esta acción',
        requiredRoles: allowedRoles,
        userRoles: req.user.roles
      });
    }

    next();
  };
}


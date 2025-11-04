import express from 'express';
import request from 'supertest';
import { AuthRequest } from '../../../src/middleware/auth';
import { requireRole } from '../../../src/middleware/rbac';
import { expect, describe, it } from 'vitest';

// Helper to build app with a specific user
function buildApp(user: any | undefined) {
  const app = express();

  app.get(
    '/admin-only',
    (req: AuthRequest, _res, next) => {
      req.user = user;
      next();
    },
    requireRole('ADMIN'),
    (_req, res) => res.status(200).json({ message: 'OK' })
  );

  app.get(
    '/user-or-admin',
    (req: AuthRequest, _res, next) => {
      req.user = user;
      next();
    },
    requireRole('ADMIN', 'USER'),
    (_req, res) => res.status(200).json({ message: 'OK' })
  );

  return app;
}

describe('requireRole middleware', () => {
  it('returns 401 if no user in request', async () => {
    const app = buildApp(undefined);
    const res = await request(app).get('/admin-only');

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No autenticado');
  });

  it('returns 403 if user lacks required role', async () => {
    const app = buildApp({
      userId: 1,
      email: 'test@test.com',
      username: 'test',
      roles: ['USER']
    });

    const res = await request(app).get('/admin-only');

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('No tiene permisos suficientes para realizar esta acción');
    expect(res.body.requiredRoles).toEqual(['ADMIN']);
    expect(res.body.userRoles).toEqual(['USER']);
  });

  it('allows access when user has required role', async () => {
    const app = buildApp({
      userId: 1,
      email: 'test@test.com',
      username: 'admin',
      roles: ['ADMIN']
    });

    const res = await request(app).get('/admin-only');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('OK');
  });

  it('allows access if user has one of multiple roles', async () => {
    const app = buildApp({
      userId: 1,
      email: 'u@test.com',
      username: 'user',
      roles: ['USER']
    });

    const res = await request(app).get('/user-or-admin');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('OK');
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import bodyParser from 'body-parser';

import { authController } from '../../../src/controllers/authController';
import { authService } from '../../../src/services/authService';
import { AuthRequest } from '../../../src/middleware/auth';

// Mock authService
vi.mock('../../../src/services/authService', () => ({
  authService: {
    login: vi.fn(),
    getMe: vi.fn()
  }
}));

const app = express();
app.use(bodyParser.json());

app.post('/login', (req, res) => authController.login(req as AuthRequest, res));
app.get('/me', (req, res) => authController.getMe(req as AuthRequest, res));

describe('authController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---- LOGIN ----
  it('returns 400 on invalid body (missing fields)', async () => {
    const res = await request(app)
      .post('/login')
      .send({ username: '', password: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  it('returns 401 on invalid credentials', async () => {
    (authService.login as any).mockRejectedValue(new Error('Credenciales inválidas'));

    const res = await request(app)
      .post('/login')
      .send({ username: 'user', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciales inválidas');
  });

  it('returns 200 and tokens on success login', async () => {
    (authService.login as any).mockResolvedValue({
      user: { id: 1, username: 'user' },
      token: 'abc123'
    });

    const res = await request(app)
      .post('/login')
      .send({ username: 'user', password: 'pass' });

    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('user');
    expect(res.body.token).toBe('abc123');
  });

  // ---- GET ME ----
  it('returns 401 if not authenticated', async () => {
    const res = await request(app).get('/me');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('No autenticado');
  });

  it('returns profile on success', async () => {
    (authService.getMe as any).mockResolvedValue({
      id: 1,
      username: 'user'
    });

    // simulate req.user
    const server = express();
    server.get('/me', (req: any, res, next) => {
      req.user = { userId: 1, roles: ['USER'] };
      next();
    }, (req, res) => authController.getMe(req as AuthRequest, res));

    const res = await request(server).get('/me');

    expect(res.status).toBe(200);
    expect(res.body.username).toBe('user');
  });
});

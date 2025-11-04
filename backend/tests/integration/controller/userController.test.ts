import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

import { userController } from '../../../src/controllers/userController';
import { userService } from '../../../src/services/userService';
import { RoleName } from '@prisma/client';

vi.mock('../../../src/services/userService', () => ({
  userService: {
    getAll: vi.fn(),
    getById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateRoles: vi.fn(),
    updateStatus: vi.fn()
  }
}));

const mockedUserService = vi.mocked(userService, true);

const app = express();
app.use(express.json());

// Fake auth middleware
app.use((req: any, _res, next) => {
  req.user = { userId: 1, roles: ['ADMIN'] };
  next();
});

app.get('/users', userController.getAll);
app.get('/users/:id', userController.getById);
app.post('/users', userController.create);
app.put('/users/:id', userController.update);
app.delete('/users/:id', userController.delete);
app.patch('/users/:id/roles', userController.updateRoles);
app.patch('/users/:id/status', userController.updateStatus);

describe('userController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------- GET ALL --------
  it('returns filtered users list', async () => {
    mockedUserService.getAll.mockResolvedValue({ page: 1, size: 10, users: [], total: 0 });

    const res = await request(app).get('/users');

    expect(res.status).toBe(200);
    expect(mockedUserService.getAll).toHaveBeenCalled();
  });

  // -------- GET BY ID --------
  it('returns user by id', async () => {
    mockedUserService.getById.mockResolvedValue({ 
      id: 1,
      email: 'admin@billing.com',
      username: 'admin',
      password: '$2a$10$eZAwQQRIlQ3haog7ysJV0OZ1rckyvDKBN95WRaAHkN06mZtdUskka',
      fullName: 'Administrador Principal',
      isActive: true,
      branchId: 1,
      createdAt: new Date('2025-10-27T00:44:14.836Z'),
      updatedAt: new Date('2025-10-27T00:44:14.836Z'),
      roles: [{
        roleId: 1,
        userId: 1,
        role: {
          name: RoleName.ADMINISTRADOR,
          id: 1,
        }
      }],
      branch: {
        id: 1,
        name: 'Sucursal Principal',
        address: 'Calle Falsa 123',
        code: 'SP001',
      }
    });

    const res = await request(app).get('/users/1');

    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Administrador Principal');
  });

  it('returns 404 if user not found', async () => {
    mockedUserService.getById.mockRejectedValue(new Error('Usuario no encontrado'));

    const res = await request(app).get('/users/999');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Usuario no encontrado');
  });

  // -------- CREATE --------
  it('creates a user', async () => {
    mockedUserService.create.mockResolvedValue({ 
      id: 1, 
      fullName: 'Test User',
      roles: [],
      password: 'hashedpassword',
      username: 'testuser',
      email: 'test@example.com',
      isActive: true,
      branchId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const res = await request(app).post('/users').send({
      email: 'test@example.com',
      username: 'testuser',
      password: '123456',
      fullName: 'Test User',
      branchId: 1,
      roleIds: [1]
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
    expect(mockedUserService.create).toHaveBeenCalled();
  });

  it('returns 400 on invalid create request', async () => {
    const res = await request(app).post('/users').send({}); // invalid

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  // -------- UPDATE --------
  it('updates a user', async () => {
    mockedUserService.update.mockResolvedValue({ 
      id: 1, 
      fullName: 'Updated User',
      roles: [],
      password: 'hashedpassword',
      username: 'testuser',
      email: 'test@example.com',
      isActive: true,
      branchId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const res = await request(app).put('/users/1').send({
      fullName: 'Updated User'
    });

    expect(res.status).toBe(200);
    expect(res.body.fullName).toBe('Updated User');
  });

  it('returns 400 on invalid update', async () => {
    const res = await request(app).put('/users/1').send({
      email: 'not_an_email'
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  // -------- DELETE --------
  it('deletes a user', async () => {
    mockedUserService.delete.mockResolvedValue({ 
      id: 1, 
      fullName: 'Test User',
      password: 'hashedpassword',
      username: 'testuser',
      email: 'test@example.com',
      isActive: true,
      branchId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const res = await request(app).delete('/users/1');

    expect(res.status).toBe(204);
    expect(mockedUserService.delete).toHaveBeenCalled();
  });

  it('returns 500 on delete error', async () => {
    mockedUserService.delete.mockRejectedValue(new Error('Delete error'));

    const res = await request(app).delete('/users/1');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Delete error');
  });

  // -------- UPDATE ROLES --------
  it('updates user roles', async () => {
    mockedUserService.updateRoles.mockResolvedValue({ 
      id: 1,
      email: 'admin@billing.com',
      username: 'admin',
      password: '$2a$10$eZAwQQRIlQ3haog7ysJV0OZ1rckyvDKBN95WRaAHkN06mZtdUskka',
      fullName: 'Administrador Principal',
      isActive: true,
      branchId: 1,
      createdAt: new Date('2025-10-27T00:44:14.836Z'),
      updatedAt: new Date('2025-10-27T00:44:14.836Z'),
      roles: [{
        roleId: 1,
        userId: 1,
        role: {
          name: RoleName.ADMINISTRADOR,
          id: 1,
        }
      }],
      branch: {
        id: 1,
        name: 'Sucursal Principal',
        address: 'Calle Falsa 123',
        code: 'SP001',
      }
    });

    const res = await request(app)
      .patch('/users/1/roles')
      .send({ roleIds: [1, 2] });

    expect(res.status).toBe(200);
    expect(res.body.roles).toEqual(
      expect.arrayContaining([
        {
          roleId: 1,
          userId: 1,
          role: {
            name: RoleName.ADMINISTRADOR,
            id: 1,
          }
        }
      ])
    );
  });

  it('returns 400 on invalid roles update', async () => {
    const res = await request(app)
      .patch('/users/1/roles')
      .send({ roleIds: [] });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  // -------- UPDATE STATUS --------
  it('updates user status', async () => {
    mockedUserService.updateStatus.mockResolvedValue({ id: 1,
      email: 'admin@billing.com',
      username: 'admin',
      password: '$2a$10$eZAwQQRIlQ3haog7ysJV0OZ1rckyvDKBN95WRaAHkN06mZtdUskka',
      fullName: 'Administrador Principal',
      isActive: false,
      branchId: 1,
      createdAt: new Date('2025-10-27T00:44:14.836Z'),
      updatedAt: new Date('2025-10-27T00:44:14.836Z'),
    });

    const res = await request(app)
      .patch('/users/1/status')
      .send({ isActive: false });

    expect(res.status).toBe(200);
    expect(res.body.isActive).toBe(false);
  });

  it('returns 400 on invalid status change', async () => {
    const res = await request(app)
      .patch('/users/1/status')
      .send({ isActive: 'notbool' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });
});

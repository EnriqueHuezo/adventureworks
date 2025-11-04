import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

import { roleController } from '../../../src/controllers/roleController';
import { roleRepository } from '../../../src/repositories/roleRepository';
import { RoleName } from '@prisma/client';

vi.mock('../../../src/repositories/roleRepository', () => ({
  roleRepository: {
    findAll: vi.fn()
  }
}));

const mockedRoleRepository = vi.mocked(roleRepository, true);

const app = express();
app.use(express.json());

// Fake auth middleware since controller expects AuthRequest
app.use((req: any, _res, next) => {
  req.user = { userId: 1, roles: ['ADMIN'] };
  next();
});

app.get('/roles', roleController.getAll);

describe('roleController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns all roles', async () => {
    const mockRoles = [
      { id: 1, name: RoleName.ADMINISTRADOR },
      { id: 2, name: RoleName.CAJERO }
    ];

    mockedRoleRepository.findAll.mockResolvedValue(mockRoles);

    const res = await request(app).get('/roles');

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
    expect(res.body[0].name).toBe('ADMINISTRADOR');
    expect(mockedRoleRepository.findAll).toHaveBeenCalled();
  });

  it('returns 500 on repository error', async () => {
    mockedRoleRepository.findAll.mockRejectedValue(new Error('DB Error'));

    const res = await request(app).get('/roles');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB Error');
  });
});

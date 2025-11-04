import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

import { clientController } from '../../../src/controllers/clientController';
import { clientRepository } from '../../../src/repositories/clientRepository';
import { ClientType } from '@prisma/client';

vi.mock('../../../src/repositories/clientRepository', () => ({
  clientRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findByDui: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  }
}));

const mockedClientRepository = vi.mocked(clientRepository, true);

const clientMock = (overrides = {}) => ({
  id: 1,
  name: 'John Doe',
  address: '123 Main St',
  email: 'john.doe@example.com',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  tipoCliente: ClientType.NATURAL,
  phone: null,
  nit: null,
  nrc: null,
  dui: null,
  actividadEconomica: null,
  nombreComercial: null,
  ...overrides
})

const app = express();
app.use(express.json());

app.get('/clients', clientController.getAll);
app.get('/clients/lookup', clientController.lookup);
app.get('/clients/:id', clientController.getById);
app.post('/clients', clientController.create);
app.put('/clients/:id', clientController.update);
app.delete('/clients/:id', clientController.delete);

describe('clientController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========== GET ALL ==========
  it('returns paginated clients', async () => {
    mockedClientRepository.findAll.mockResolvedValue({
      clients: [clientMock()],
      total: 1,
      page: 1,
      size: 25
    });

    const res = await request(app).get('/clients');

    expect(res.status).toBe(200);
    expect(res.body.clients.length).toBe(1);
    expect(mockedClientRepository.findAll).toHaveBeenCalled();
  });

  it('handles DB error on getAll', async () => {
    mockedClientRepository.findAll.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/clients');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB error');
  });

  // ========== GET BY ID ==========
  it('returns client by id', async () => {
    mockedClientRepository.findById.mockResolvedValue(clientMock());

    const res = await request(app).get('/clients/1');

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('John Doe');
  });

  it('returns 404 if client not found', async () => {
    mockedClientRepository.findById.mockResolvedValue(null);

    const res = await request(app).get('/clients/99');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Cliente no encontrado');
  });

  // ========== LOOKUP BY DUI ==========
  it('returns client by DUI', async () => {
    mockedClientRepository.findByDui.mockResolvedValue(clientMock({ dui: '12345678-9' }));

    const res = await request(app).get('/clients/lookup?dui=12345678-9');

    expect(res.status).toBe(200);
    expect(res.body.dui).toBe('12345678-9');
  });

  it('returns 400 when DUI missing', async () => {
    const res = await request(app).get('/clients/lookup');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('DUI requerido');
  });

  it('returns 404 when DUI not found', async () => {
    mockedClientRepository.findByDui.mockResolvedValue(null);

    const res = await request(app).get('/clients/lookup?dui=123');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Cliente no encontrado');
  });

  // ========== CREATE ==========
  it('creates a client', async () => {
    mockedClientRepository.create.mockResolvedValue(clientMock());

    const res = await request(app)
      .post('/clients')
      .send({ name: 'John' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('John Doe');
  });

  it('returns 400 for invalid client data', async () => {
    const res = await request(app)
      .post('/clients')
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  // ========== UPDATE ==========
  it('updates a client', async () => {
    mockedClientRepository.update.mockResolvedValue(clientMock({ id: 1, name: 'John Updated' }));

    const res = await request(app)
      .put('/clients/1')
      .send({ name: 'John Updated' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('John Updated');
  });

  it('returns 400 on invalid update data', async () => {
    const res = await request(app)
      .put('/clients/1')
      .send({ name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  // ========== DELETE ==========
  it('deletes a client', async () => {
    mockedClientRepository.delete.mockResolvedValue(clientMock());

    const res = await request(app).delete('/clients/1');

    expect(res.status).toBe(204);
  });

  it('handles DB error on delete', async () => {
    mockedClientRepository.delete.mockRejectedValue(new Error('DB error'));

    const res = await request(app).delete('/clients/1');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB error');
  });
});

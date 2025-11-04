import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

import { supplierController } from '../../../src/controllers/supplierController';
import { supplierRepository } from '../../../src/repositories/supplierRepository';

vi.mock('../../../src/repositories/supplierRepository', () => ({
  supplierRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

const app = express();
app.use(express.json());

// Fake auth middleware
app.use((req: any, _res, next) => {
  req.user = { userId: 1, roles: ['ADMIN'] };
  next();
});

app.get('/suppliers', supplierController.getAll);
app.get('/suppliers/:id', supplierController.getById);
app.post('/suppliers', supplierController.create);
app.put('/suppliers/:id', supplierController.update);
app.delete('/suppliers/:id', supplierController.delete);

const mockedSupplierRepository = vi.mocked(supplierRepository, true);
const supplierMock = (company?: string) => ({
  id: 1,
  company: company || 'ACME',
  contact: null,
  email: null,
  phone: null,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

describe('supplierController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------- GET ALL --------
  it('returns paginated suppliers', async () => {
    mockedSupplierRepository.findAll.mockResolvedValue({ 
      suppliers: [],
      total: 0,
      page: 1,
      size: 10
    });

    const res = await request(app).get('/suppliers');

    expect(res.status).toBe(200);
    expect(mockedSupplierRepository.findAll).toHaveBeenCalled();
  });

  // -------- GET BY ID --------
  it('returns supplier by id', async () => {
    mockedSupplierRepository.findById.mockResolvedValue(supplierMock());

    const res = await request(app).get('/suppliers/1');

    expect(res.status).toBe(200);
    expect(res.body.company).toBe('ACME');
  });

  it('returns 404 when supplier not found', async () => {
    mockedSupplierRepository.findById.mockResolvedValue(null);

    const res = await request(app).get('/suppliers/999');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Proveedor no encontrado');
  });

  // -------- CREATE --------
  it('creates a supplier', async () => {
    mockedSupplierRepository.create.mockResolvedValue(supplierMock());

    const res = await request(app)
      .post('/suppliers')
      .send({ company: 'ACME', email: 'test@example.com' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
    expect(mockedSupplierRepository.create).toHaveBeenCalled();
  });

  it('returns 400 on invalid supplier creation', async () => {
    const res = await request(app)
      .post('/suppliers')
      .send({}); // invalid body

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  // -------- UPDATE --------
  it('updates a supplier', async () => {
    mockedSupplierRepository.update.mockResolvedValue(supplierMock('Updated Co'));

    const res = await request(app)
      .put('/suppliers/1')
      .send({ company: 'Updated Co' });

    expect(res.status).toBe(200);
    expect(res.body.company).toBe('Updated Co');
    expect(supplierRepository.update).toHaveBeenCalled();
  });

  it('returns 400 on invalid supplier update', async () => {
    const res = await request(app)
      .put('/suppliers/1')
      .send({ email: 'not_an_email' }); // zod invalid

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  // -------- DELETE --------
  it('deletes a supplier', async () => {
    mockedSupplierRepository.delete.mockResolvedValue(supplierMock());

    const res = await request(app).delete('/suppliers/1');

    expect(res.status).toBe(204);
    expect(mockedSupplierRepository.delete).toHaveBeenCalled();
  });

  it('returns 500 on delete error', async () => {
    mockedSupplierRepository.delete.mockRejectedValue(new Error('Delete error'));

    const res = await request(app).delete('/suppliers/1');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Delete error');
  });
});

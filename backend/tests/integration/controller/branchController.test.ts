import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

import { branchController } from '../../../src/controllers/branchController';
import { branchRepository } from '../../../src/repositories/branchRepository';
import { sequenceRepository } from '../../../src/repositories/sequenceRepository';

// Mock Repositories
vi.mock('../../../src/repositories/branchRepository', () => ({
  branchRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
  }
}));

vi.mock('../../../src/repositories/sequenceRepository', () => ({
  sequenceRepository: {
    findByBranch: vi.fn(),
    create: vi.fn(),
  }
}));

const mockedBranchRepository = vi.mocked(branchRepository, true);
const mockedSequenceRepository = vi.mocked(sequenceRepository, true);

const mockedBranch = (overrides = {}) => ({
  id: 1,
  name: 'Sucursal Central',
  address: 'Calle Falsa 123',
  code: 'SC001',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  sequences: [{
    id: 1,
    branchId: 1,
    series: 'A',
    nextValue: 1
  }],
  ...overrides
});

const app = express();
app.use(express.json());

// Routes
app.get('/branches', branchController.getAll);
app.get('/branches/:id', branchController.getById);
app.get('/branches/:id/sequences', branchController.getSequences);
app.post('/branches/:id/sequences', branchController.createSequence);

describe('branchController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ========= GET ALL =========
  it('returns branches list', async () => {
    mockedBranchRepository.findAll.mockResolvedValue([mockedBranch()]);

    const res = await request(app).get('/branches');

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(mockedBranchRepository.findAll).toHaveBeenCalled();
  });

  it('handles error on getAll', async () => {
    mockedBranchRepository.findAll.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/branches');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB error');
  });

  // ========= GET BY ID =========
  it('returns branch by ID', async () => {
    mockedBranchRepository.findById.mockResolvedValue(mockedBranch());

    const res = await request(app).get('/branches/1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 if branch not found', async () => {
    mockedBranchRepository.findById.mockResolvedValue(null);

    const res = await request(app).get('/branches/999');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Sucursal no encontrada');
  });

  it('handles DB error on findById', async () => {
    mockedBranchRepository.findById.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/branches/1');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB error');
  });

  // ========= GET SEQUENCES =========
  it('returns sequences for branch', async () => {
    mockedSequenceRepository.findByBranch.mockResolvedValue([mockedBranch().sequences[0]]);

    const res = await request(app).get('/branches/1/sequences');

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  it('handles DB error on getSequences', async () => {
    mockedSequenceRepository.findByBranch.mockRejectedValue(new Error('DB error'));

    const res = await request(app).get('/branches/1/sequences');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB error');
  });

  // ========= CREATE SEQUENCE =========
  it('creates a sequence', async () => {
    mockedSequenceRepository.create.mockResolvedValue(mockedBranch().sequences[0]);

    const res = await request(app)
      .post('/branches/1/sequences')
      .send({ series: 'A' });

    expect(res.status).toBe(201);
    expect(res.body.series).toBe('A');
  });

  it('returns 400 for invalid body on createSequence', async () => {
    const res = await request(app)
      .post('/branches/1/sequences')
      .send({ series: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  it('handles DB error on createSequence', async () => {
    mockedSequenceRepository.create.mockRejectedValue(new Error('DB error'));

    const res = await request(app)
      .post('/branches/1/sequences')
      .send({ series: 'A' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('DB error');
  });
});

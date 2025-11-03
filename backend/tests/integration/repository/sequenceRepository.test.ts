import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { sequenceRepository } from '../../../src/repositories/sequenceRepository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('sequenceRepository', () => {
  let branchId: number;
  beforeAll(async () => {
    const branch = await prisma.branch.create({
      data: { 
        name: 'Invoice Test Branch Sequence',
        code: 'TEST002', 
        address: 'Branch Street 1' 
      }
    });
    branchId = branch.id;
  });

  afterAll(async () => {
    await prisma.branch.deleteMany({
      where: { id: branchId }
    });
    await prisma.sequence.deleteMany({
      where: { branchId }
    });
    await prisma.$disconnect();
  });

  it('create should initialize sequence', async () => {
    const seq = await sequenceRepository.create(branchId, 'A');
    expect(seq.branchId).toBe(branchId);
    expect(seq.series).toBe('A');
    expect(seq.nextValue).toBe(1);
  });

  it('create should fail if sequence for branch already exists', async () => {
    await expect(sequenceRepository.create(branchId, 'A')).rejects.toThrow();
  });

  it('getNextValue should return 1 for first call and increment afterwards', async () => {
    const v1 = await sequenceRepository.getNextValue(branchId, 'B');
    const v2 = await sequenceRepository.getNextValue(branchId, 'B');
    const v3 = await sequenceRepository.getNextValue(branchId, 'B');

    expect(v1).toBe(1);
    expect(v2).toBe(2);
    expect(v3).toBe(3);
  });

  it('getNextValue should use existing sequence and increment', async () => {
    const first = await sequenceRepository.getNextValue(branchId, 'A');
    const second = await sequenceRepository.getNextValue(branchId, 'A');
    expect(second).toBe(first + 1);
  });

  it('findByBranch should return sequences for branch', async () => {
    const sequences = await sequenceRepository.findByBranch(branchId);
    expect(Array.isArray(sequences)).toBe(true);
    expect(sequences.length).toBeGreaterThan(0);
    expect(sequences.some(s => s.branchId === branchId)).toBe(true);
  });
});

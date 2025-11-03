import { describe, it, expect } from 'vitest';
import { branchRepository } from '../../src/repositories/branchRepository';

describe('Branches integration', () => {
  it('findAll should return all branches ordered by name', async () => {
    const branches = await branchRepository.findAll();
    expect(branches).toBeDefined();
    expect(branches.length).toBeGreaterThan(0);
    expect(branches[0].name).toBeDefined();

    // verify ordering by name
    const sorted = [...branches].sort((a, b) => a.name.localeCompare(b.name));
    expect(branches.map(b => b.name)).toEqual(sorted.map(b => b.name));
  });

  it('findById should return a branch with sequences', async () => {
    const branches = await branchRepository.findAll();
    const branchId = branches[0].id;

    const branch = await branchRepository.findById(branchId);
    expect(branch).toBeDefined();
    expect(branch?.id).toBe(branchId);
    expect(branch?.name).toBeDefined();
    expect(branch?.sequences).toBeDefined();
    expect(Array.isArray(branch?.sequences)).toBe(true);
  });

  it('findById should return null for non-existing branch', async () => {
    const branch = await branchRepository.findById(999999); // assuming this ID does not exist 
    expect(branch).toBeNull();
  });
});

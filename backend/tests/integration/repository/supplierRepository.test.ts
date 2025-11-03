import { describe, it, expect, afterAll } from 'vitest';
import { supplierRepository } from '../../../src/repositories/supplierRepository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('supplierRepository', () => {
  let supplierId: number;

  afterAll(async () => {
    await prisma.supplier.deleteMany({
      where: { id: supplierId }
    });
    await prisma.$disconnect();
  });

  it('create should add a supplier', async () => {
    const supplier = await supplierRepository.create({
      company: 'Proveedor Test',
      contact: 'Juan Perez',
      email: 'proveedor@test.com',
      phone: '1111-1111',
      isActive: true
    });
    supplierId = supplier.id;
    expect(supplier.id).toBeDefined();
    expect(supplier.company).toBe('Proveedor Test');
  });

  it('findById should return a supplier', async () => {
    const supplier = await supplierRepository.findById(supplierId);
    expect(supplier?.id).toBe(supplierId);
    expect(supplier?.company).toBe('Proveedor Test');
  });

  it('findAll should return paginated suppliers', async () => {
    const result = await supplierRepository.findAll({ page: 1, size: 5 });
    expect(result.suppliers.length).toBeGreaterThan(0);
    expect(result.page).toBe(1);
  });

  it('update should modify supplier data', async () => {
    const updated = await supplierRepository.update(supplierId, {
      phone: '2222-2222'
    });
    expect(updated.phone).toBe('2222-2222');
  });

  it('delete should set isActive false', async () => {
    const deleted = await supplierRepository.delete(supplierId);
    expect(deleted.isActive).toBe(false);

    const found = await supplierRepository.findById(supplierId);
    expect(found?.isActive).toBe(false);
  });

  it('findAll with q filter should return filtered list', async () => {
    const result = await supplierRepository.findAll({ q: 'Proveedor' });
    expect(result.suppliers.length).toBeGreaterThan(0);
  });
});

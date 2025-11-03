import { describe, it, expect, test, afterAll } from 'vitest';
import { clientRepository } from '../../src/repositories/clientRepository';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Client integration', () => {
  let testClientId: number;

  afterAll(async () => {
    await prisma.client.deleteMany({
      where: { email: 'new.client@example.com' }
    });
    await prisma.$disconnect();
  })

  it('create should add a new client', async () => {
    const newClient = await clientRepository.create({
      name: 'New Client',
      email: 'new.client@example.com',
      phone: '9876-5432',
      address: 'New Street 456',
      nit: '0614-987654-321-0',
      nrc: '765432-1',
      dui: '87654321-0',
      isActive: true
    });
    expect(newClient).toBeDefined();
    expect(newClient.id).toBeDefined();
  });

  it('findByDui should return a client', async () => {
    const client = await clientRepository.findByDui('87654321-0');
    expect(client).toBeDefined();
    expect(client?.dui).toBe('87654321-0');
    testClientId = client!.id;
  });

  it('update should modify a client', async () => {
    const updated = await clientRepository.update(testClientId, { name: 'Updated Client' });
    expect(updated.name).toBe('Updated Client');
  });

  it('findAll should return clients', async () => {
    const result = await clientRepository.findAll({});
    expect(result.clients.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
    expect(result.page).toBe(1);
    expect(result.size).toBe(25);
  });

  it('findAll with query should filter correctly', async () => {
    const result = await clientRepository.findAll({ q: 'Updated Client' });
    expect(result.clients.length).toBeGreaterThan(0);
    expect(result.clients[0].name).toBe('Updated Client');
  });

  it('findById should return a client', async () => {
    const client = await clientRepository.findById(testClientId);
    expect(client).toBeDefined();
    expect(client?.id).toBe(testClientId);
  });

  it('delete should soft delete a client', async () => {
    const deleted = await clientRepository.delete(testClientId);
    expect(deleted.isActive).toBe(false);

    const client = await clientRepository.findById(testClientId);
    expect(client?.isActive).toBe(false);
  });

  // ----------------------
  // Expected failures
  // ----------------------

  test.fails('update non-existing client should fail', async () => {
    await clientRepository.update(-1, { name: 'Fail Update' } as any);
  });

  test.fails('delete non-existing client should fail', async () => {
    await clientRepository.delete(-1);
  });
});

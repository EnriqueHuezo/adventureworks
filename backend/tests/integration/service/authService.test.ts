import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authService } from '../../../src/services/authService';
import { roleRepository } from '../../../src/repositories/roleRepository';

const prisma = new PrismaClient();

describe('Auth service', () => {
  let testUserId: number;
  let branchId: number;
  const plainPassword = 'TestPassword123';
  let hashedPassword: string;
  let originalSecret: string | undefined;

  beforeAll(async () => {
    hashedPassword = await bcrypt.hash(plainPassword, 10);

    const branch = await prisma.branch.create({
      data: { name: 'Auth Test Branch', code: 'AUTH001', address: 'Branch St 1' }
    });

    const role = await roleRepository.findByName('CAJERO');

    branchId = branch.id;

    const user = await prisma.user.create({
      data: {
        username: 'testauthuser',
        email: 'testauth@example.com',
        password: hashedPassword,
        fullName: 'Test Auth User',
        branchId: branchId,
        roles: { create: [{ roleId: role!.id }] },
        isActive: true
      }
    });

    testUserId = user.id;
    originalSecret = process.env.JWT_SECRET;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.branch.deleteMany({ where: { id: branchId } });
    await prisma.$disconnect();
    process.env.JWT_SECRET = originalSecret;
  });

  it('login should return token and user info for valid credentials', async () => {
    const result = await authService.login('testauthuser', plainPassword);
    expect(result.token).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.username).toBe('testauthuser');
  });

  it('login should fail for invalid password', async () => {
    await expect(authService.login('testauthuser', 'wrongpassword')).rejects.toThrow('Credenciales inválidas');
  });

  it('login should fail for inactive user', async () => {
    await prisma.user.update({ where: { id: testUserId }, data: { isActive: false } });
    await expect(authService.login('testauthuser', plainPassword)).rejects.toThrow('Credenciales inválidas');
    await prisma.user.update({ where: { id: testUserId }, data: { isActive: true } });
  });

  it('login should fail for non-existing user', async () => {
    await expect(authService.login('nonexistent', 'any')).rejects.toThrow('Credenciales inválidas');
  });

  it('login should return token and user info for valid credentials using default secret', async () => {
    delete process.env.JWT_SECRET;
    const result = await authService.login('testauthuser', plainPassword);
    expect(result.token).toBeDefined();
    expect(result.user).toBeDefined();
    expect(result.user.username).toBe('testauthuser');
  });

  it('getMe should return user info', async () => {
    const result = await authService.getMe(testUserId);
    expect(result).toBeDefined();
    expect(result.id).toBe(testUserId);
    expect(result.username).toBe('testauthuser');
    expect(result.branch).toBeDefined();
  });

  it('getMe should throw error for non-existing user', async () => {
    await expect(authService.getMe(-1)).rejects.toThrow('Usuario no encontrado');
  });
});

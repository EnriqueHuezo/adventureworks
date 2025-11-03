import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { userService } from '../../../src/services/userService';
import bcrypt from 'bcryptjs';
import { roleRepository } from '../../../src/repositories/roleRepository';

const prisma = new PrismaClient();

describe('User service', () => {
  let userId1: number;
  let userId2: number;
  let roleId: number;
  let branchId: number;

  beforeAll(async () => {
    const role = await roleRepository.findByName('CAJERO');
    roleId = role!.id;

    const branch = await prisma.branch.create({
      data: { name: 'Test Branch User Service', code: 'TBUS001', address: 'Branch St' }
    });
    branchId = branch.id;
  });

  afterAll(async () => {
    if (userId1) await prisma.user.deleteMany({ where: { id: userId1 } });
    if (userId2) await prisma.user.deleteMany({ where: { id: userId2 } });
    await prisma.branch.deleteMany({ where: { id: branchId } });
    await prisma.$disconnect();
  });

  it('create a user with hashed password', async () => {
    const user = await userService.create({
      email: 'testuserservice@test.com',
      username: 'testuserservice',
      password: 'password123',
      fullName: 'Test User',
      branchId,
      roleIds: [roleId]
    });

    userId1 = user.id;

    expect(user.id).toBeDefined();
    expect(user.email).toBe('testuserservice@test.com');
    const isPasswordValid = await bcrypt.compare('password123', user.password);
    expect(isPasswordValid).toBe(true);
  });

  it('create a user with hashed password', async () => {
    const user = await userService.create({
      email: 'testuserservice2@test.com',
      username: 'testuserservice2',
      password: 'password123',
      fullName: 'Test User',
      roleIds: [roleId]
    });

    userId2 = user.id;

    expect(user.id).toBeDefined();
    expect(user.email).toBe('testuserservice2@test.com');
    const isPasswordValid = await bcrypt.compare('password123', user.password);
    expect(isPasswordValid).toBe(true);
  });

  it('getAll should return users with filters', async () => {
    const users = await userService.getAll({ status: true });
    expect(users.users.length).toBeGreaterThan(0);
    const user = users.users.find(u => u.id === userId1);
    expect(user).toBeDefined();
  });

  it('getById should get a user by id', async () => {
    const user = await userService.getById(userId1);
    expect(user.id).toBe(userId1);
  });

  it('getById should throw error if user not found', async () => {
    await expect(userService.getById(-1)).rejects.toThrow('Usuario no encontrado');
  });

  it('update should update user data and password', async () => {
    const updated = await userService.update(userId1, {
      fullName: 'Updated User',
      password: 'newpass'
    });

    expect(updated.fullName).toBe('Updated User');
    const isPasswordValid = await bcrypt.compare('newpass', updated.password);
    expect(isPasswordValid).toBe(true);
  });

  it('update should update user branch', async () => {
    const updated = await userService.update(userId1, { branchId: branchId });
    expect(updated.branchId).toBe(branchId);
  });

  it('update should update user branch', async () => {
    const updated = await userService.update(userId1, { branchId: null });
    expect(updated.branchId).toBeNull();
  });

  it('update should update user roles', async () => {
    const updated = await userService.updateRoles(userId1, []);
    expect(updated!.roles.length).toBe(0);
  });

  it('update should update user status', async () => {
    const updated = await userService.updateStatus(userId1, false);
    expect(updated.isActive).toBe(false);
  });

  it('delete should delete a user', async () => {
    const deleted = await userService.delete(userId1);
    expect(deleted.id).toBe(userId1);

    // Ensure user is gone
    const user = await prisma.user.findUnique({ where: { id: userId1 } });
    expect(user).toBeNull();
  });
});

import { describe, it, expect, beforeAll } from 'vitest';
import { userRepository } from '../../src/repositories/userRepository';
import { roleRepository } from '../../src/repositories/roleRepository';
import { branchRepository } from '../../src/repositories/branchRepository';
import bcrypt from 'bcryptjs';

describe('Users integration', () => {
  let testUserId: number;
  let testRoleId: number;
  let testBranchId: number;

  beforeAll(async () => {
    // Get role ID for tests
    const role = await roleRepository.findByName('ADMINISTRADOR');
    testRoleId = role!.id;

    // Get branch ID for tests
    const branch = await branchRepository.findById(1);
    testBranchId = branch!.id;

  });

  // ----------------------
  // findById
  // ----------------------
  it('findById should return user with roles and branch', async () => {
    const user = await userRepository.findByUsername('admin');
    const result = await userRepository.findById(user!.id);
    expect(result).toBeDefined();
    expect(result!.roles.length).toBeGreaterThan(0);
    expect(result!.branch).toBeDefined();
  });

  it('findById should return null for non-existing user', async () => {
    const result = await userRepository.findById(999999);
    expect(result).toBeNull();
  });

  // ----------------------
  // findByEmail
  // ----------------------
  it('findByEmail should return user with roles', async () => {
    const user = await userRepository.findByEmail('admin@billing.com');
    expect(user).toBeDefined();
    expect(user?.roles.length).toBeGreaterThan(0);
  });

  it('findByEmail should return null for non-existing email', async () => {
    const user = await userRepository.findByEmail('nonexistent@email.com');
    expect(user).toBeNull();
  });

  // ----------------------
  // findByUsername
  // ----------------------
  it('findByUsername should return user with roles', async () => {
    const user = await userRepository.findByUsername('admin');
    expect(user).toBeDefined();
    expect(user?.roles.length).toBeGreaterThan(0);
  });

  it('findByUsername should return null for non-existing username', async () => {
    const user = await userRepository.findByUsername('nonexistentuser');
    expect(user).toBeNull();
  });

  // ----------------------
  // create
  // ----------------------
  it('create should insert a new user', async () => {
    const hashedPassword = await bcrypt.hash('test123', 10);
    const newUser = await userRepository.create({
      username: 'testuser',
      email: 'testuser@example.com',
      password: hashedPassword,
      fullName: 'Test User',
      branch: {
        connect: { id: testBranchId }
      },
      roles: {
        create: [{ roleId: testRoleId }]
      }
    });
    testUserId = newUser.id;
    expect(newUser.username).toBe('testuser');
    expect(newUser.roles.length).toBe(1);
  });

  // ----------------------
  // update
  // ----------------------
  it('update should modify existing user', async () => {
    const updated = await userRepository.update(testUserId, { fullName: 'Updated User' });
    expect(updated.fullName).toBe('Updated User');
  });

  // ----------------------
  // updateRoles
  // ----------------------
  it('updateRoles should update user roles', async () => {
    await userRepository.updateRoles(testUserId, [testRoleId]);
    const user = await userRepository.findById(testUserId);
    expect(user!.roles.length).toBe(1);
    expect(user!.roles[0].roleId).toBe(testRoleId);
  });

  // ----------------------
  // updateStatus
  // ----------------------
  it('updateStatus should modify user active status', async () => {
    const updated = await userRepository.updateStatus(testUserId, false);
    expect(updated.isActive).toBe(false);
    // revert status
    await userRepository.updateStatus(testUserId, true);
  });

  // ----------------------
  // findAll
  // ----------------------
  it('findAll should return users with pagination', async () => {
    const result = await userRepository.findAll({ page: 1, size: 2 });
    expect(result.users.length).toBeLessThanOrEqual(2);
    expect(result.total).toBeGreaterThan(0);
    expect(result.page).toBe(1);
    expect(result.size).toBe(2);
  });

  it('findAll should filter by search query', async () => {
    const result = await userRepository.findAll({ q: 'admin' });
    expect(result.users.every(u => u.username.includes('admin') || u.email.includes('admin'))).toBe(true);
  });

  it('findAll should filter by role', async () => {
    const result = await userRepository.findAll({ role: 'ADMINISTRADOR' });
    expect(result.users.every(u => u.roles.some(r => r.role.name === 'ADMINISTRADOR'))).toBe(true);
  });

  it('findAll should filter by status', async () => {
    const result = await userRepository.findAll({ status: true });
    expect(result.users.every(u => u.isActive)).toBe(true);
  });

  // ----------------------
  // delete
  // ----------------------
  it('delete should remove user', async () => {
    const deleted = await userRepository.delete(testUserId);
    expect(deleted.id).toBe(testUserId);
    const shouldBeNull = await userRepository.findById(testUserId);
    expect(shouldBeNull).toBeNull();
  });
});

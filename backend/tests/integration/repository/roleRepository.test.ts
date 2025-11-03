import { describe, it, expect, test } from 'vitest';
import { roleRepository } from '../../../src/repositories/roleRepository';

describe('Roles integration', () => {
  it('findAll should return all roles', async () => {
    const roles = await roleRepository.findAll();
    expect(roles).toBeDefined();
    expect(roles.length).toBeGreaterThan(0);
    roles.forEach(role => {
      expect(role.name).toBeDefined();
    });
  });

  it('findByName should return role by name', async () => {
    const roleName = 'ADMINISTRADOR';
    const role = await roleRepository.findByName(roleName);
    expect(role).toBeDefined();
    expect(role?.name).toBe(roleName);
  });

  test.fails('findByName with invalid enum should fail', async () => {
    await roleRepository.findByName('NO_EXISTE' as any);
  });
});

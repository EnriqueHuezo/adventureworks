import { describe, it, expect } from 'vitest';
import { userRepository } from '../../src/repositories/userRepository';

describe('Users integration', () => {
  it('findByUsername should return user with roles', async () => {
    const user = await userRepository.findByUsername('admin');
    expect(user).toBeDefined();
    expect(user?.username).toBe('admin');
    expect(user?.roles.length).toBeGreaterThan(0);
    expect(user?.roles[0].role).toBeDefined();
  });
  it('findByUsername should return null for non-existing user', async () => {
    const user = await userRepository.findByUsername('nonexistentuser');
    expect(user).toBeNull();
  });
});

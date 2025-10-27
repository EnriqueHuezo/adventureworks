import { describe, it, expect } from 'vitest';
import { prisma } from './setup';

describe('Users integration', () => {
  it('should have admin users from seed', async () => {
    const admin = await prisma.user.findUnique({ where: { username: 'admin' } });
    expect(admin).toBeDefined();
    expect(admin?.fullName).toBe('Administrador Principal');
  });
});

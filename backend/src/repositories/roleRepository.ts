import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const roleRepository = {
  async findAll() {
    return prisma.role.findMany();
  },

  async findByName(name: string) {
    return prisma.role.findUnique({
      where: { name: name as any }
    });
  }
};


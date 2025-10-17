import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const branchRepository = {
  async findAll() {
    return prisma.branch.findMany({
      orderBy: { name: 'asc' }
    });
  },

  async findById(id: number) {
    return prisma.branch.findUnique({
      where: { id },
      include: {
        sequences: true
      }
    });
  }
};


import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface ClientFilters {
  q?: string;
  page?: number;
  size?: number;
}

export const clientRepository = {
  async findAll(filters: ClientFilters) {
    const { q, page = 1, size = 25 } = filters;
    const skip = (page - 1) * size;

    const where: Prisma.ClientWhereInput = { isActive: true };

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { nit: { contains: q, mode: 'insensitive' } },
        { nrc: { contains: q, mode: 'insensitive' } },
        { dui: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        where,
        skip,
        take: size,
        orderBy: { name: 'asc' }
      }),
      prisma.client.count({ where })
    ]);

    return { clients, total, page, size };
  },

  async findById(id: number) {
    return prisma.client.findUnique({
      where: { id }
    });
  },

  async findByDui(dui: string) {
    return prisma.client.findUnique({
      where: { dui }
    });
  },

  async create(data: Prisma.ClientCreateInput) {
    return prisma.client.create({ data });
  },

  async update(id: number, data: Prisma.ClientUpdateInput) {
    return prisma.client.update({
      where: { id },
      data
    });
  },

  async delete(id: number) {
    return prisma.client.update({
      where: { id },
      data: { isActive: false }
    });
  }
};


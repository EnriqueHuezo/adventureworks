import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface SupplierFilters {
  q?: string;
  page?: number;
  size?: number;
}

export const supplierRepository = {
  async findAll(filters: SupplierFilters) {
    const { q, page = 1, size = 25 } = filters;
    const skip = (page - 1) * size;

    const where: Prisma.SupplierWhereInput = { isActive: true };

    if (q) {
      where.OR = [
        { company: { contains: q, mode: 'insensitive' } },
        { contact: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        skip,
        take: size,
        orderBy: { company: 'asc' }
      }),
      prisma.supplier.count({ where })
    ]);

    return { suppliers, total, page, size };
  },

  async findById(id: number) {
    return prisma.supplier.findUnique({
      where: { id }
    });
  },

  async create(data: Prisma.SupplierCreateInput) {
    return prisma.supplier.create({ data });
  },

  async update(id: number, data: Prisma.SupplierUpdateInput) {
    return prisma.supplier.update({
      where: { id },
      data
    });
  },

  async delete(id: number) {
    return prisma.supplier.update({
      where: { id },
      data: { isActive: false }
    });
  }
};


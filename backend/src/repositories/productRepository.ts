import { PrismaClient, Prisma, ProductType } from '@prisma/client';

const prisma = new PrismaClient();

export interface ProductFilters {
  query?: string;
  type?: ProductType;
  page?: number;
  size?: number;
}

export const productRepository = {
  async findAll(filters: ProductFilters) {
    const { query, type, page = 1, size = 25 } = filters;
    const skip = (page - 1) * size;

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } }
      ];
    }

    if (type) {
      where.type = type;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: size,
        orderBy: { name: 'asc' }
      }),
      prisma.product.count({ where })
    ]);

    return { products, total, page, size };
  },

  async findById(id: number) {
    return prisma.product.findUnique({
      where: { id }
    });
  },

  async findBySku(sku: string) {
    return prisma.product.findUnique({
      where: { sku }
    });
  },

  async findLowStock(threshold: number = 10) {
    return prisma.product.findMany({
      where: {
        isActive: true,
        type: 'PRODUCTO',
        stockQty: {
          lte: threshold
        }
      },
      orderBy: { stockQty: 'asc' }
    });
  },

  async create(data: Prisma.ProductCreateInput) {
    return prisma.product.create({ data });
  },

  async update(id: number, data: Prisma.ProductUpdateInput) {
    return prisma.product.update({
      where: { id },
      data
    });
  },

  async delete(id: number) {
    return prisma.product.update({
      where: { id },
      data: { isActive: false }
    });
  },

  async updateStock(productId: number, delta: number) {
    return prisma.product.update({
      where: { id: productId },
      data: {
        stockQty: {
          increment: delta
        }
      }
    });
  }
};


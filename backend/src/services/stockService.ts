import { PrismaClient, StockType } from '@prisma/client';
import { productRepository } from '../repositories/productRepository';

const prisma = new PrismaClient();

export const stockService = {
  async adjustStock(productId: number, type: StockType, qty: number, note?: string) {
    return prisma.$transaction(async (tx) => {
      const product = await productRepository.findById(productId);
      if (!product) {
        throw new Error('Producto no encontrado');
      }

      // Calculate delta
      let delta = 0;
      if (type === 'IN') {
        delta = qty;
      } else if (type === 'OUT') {
        delta = -qty;
      } else if (type === 'ADJUST') {
        // Adjust sets the quantity to the specified value
        delta = qty - product.stockQty;
      }

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          productId,
          type,
          qty: Math.abs(delta),
          note
        }
      });

      // Update product stock
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stockQty: {
            increment: delta
          }
        }
      });

      return updatedProduct;
    });
  },

  async getMovements(productId: number) {
    return prisma.stockMovement.findMany({
      where: { productId },
      include: {
        product: true
      },
      orderBy: { createdAt: 'desc' }
    });
  }
};


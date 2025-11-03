import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, StockType, ProductType } from '@prisma/client';
import { stockService } from '../../../src/services/stockService';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

describe('Stock service', () => {
  let productId: number;

  beforeAll(async () => {
    const product = await prisma.product.create({
      data: {
        name: 'Test Product stock',
        sku: 'TPSS001',
        type: ProductType.PRODUCTO,
        unitPrice: new Decimal(100),
        cost: new Decimal(50),
        stockQty: 100,
        isActive: true
      }
    });
    productId = product.id;
  });

  afterAll(async () => {
    await prisma.stockMovement.deleteMany({ where: { productId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.$disconnect();
  });

  it('should throw error if product does not exist', async () => {
    await expect(stockService.adjustStock(-1, 'IN', 10, 'Test note'))
      .rejects.toThrow('Producto no encontrado');
  });

  it('should increment stock for IN type', async () => {
    const updated = await stockService.adjustStock(productId, 'IN', 10, 'Restock');
    expect(updated.stockQty).toBe(110);

    const movements = await stockService.getMovements(productId);
    expect(movements[0].type).toBe('IN');
    expect(movements[0].qty).toBe(10);
  });

  it('should decrement stock for OUT type', async () => {
    const updated = await stockService.adjustStock(productId, 'OUT', 20, 'Sale');
    expect(updated.stockQty).toBe(90);

    const movements = await stockService.getMovements(productId);
    expect(movements[0].type).toBe('OUT');
    expect(movements[0].qty).toBe(20);
  });

  it('should adjust stock to exact quantity for ADJUST type', async () => {
    const updated = await stockService.adjustStock(productId, 'ADJUST', 50, 'Adjustment');
    expect(updated.stockQty).toBe(50);

    const movements = await stockService.getMovements(productId);
    expect(movements[0].type).toBe('ADJUST');
    expect(movements[0].qty).toBe(40); // delta = 50 - previous 90 = -40, abs = 40
  });

  it.fails('should fail to adjust stock to exact quantity for type not in StockType enum', async () => {
    await stockService.adjustStock(productId, 'test', 50, 'Adjustment')
  });

  it('should return movements in descending order', async () => {
    const movements = await stockService.getMovements(productId);
    expect(movements.length).toBeGreaterThanOrEqual(3);
    expect(new Date(movements[0].createdAt).getTime()).toBeGreaterThanOrEqual(
      new Date(movements[1].createdAt).getTime()
    );
  });
});

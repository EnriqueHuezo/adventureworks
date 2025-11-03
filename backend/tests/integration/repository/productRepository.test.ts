import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { productRepository } from '../../../src/repositories/productRepository';
import { PrismaClient, ProductType } from '@prisma/client';

const prisma = new PrismaClient();

describe('Products integration', () => {
  let productId: number;

  afterAll(async () => {
    await prisma.product.deleteMany({
      where: {
        id: productId
      }
    });
    await prisma.$disconnect();
  });

  it('create should add a new product', async () => {
    const product = await productRepository.create({
      name: 'Producto Test',
      sku: 'TEST-001',
      type: ProductType.PRODUCTO,
      unitPrice: 100.0,
      stockQty: 5,
      cost: 70.0,
      isActive: true
    });
    productId = product.id;
    expect(product).toHaveProperty('id');
    expect(product.name).toBe('Producto Test');
  });

  it('findAll should return paginated products', async () => {
    const result = await productRepository.findAll({ page: 1, size: 10 });
    expect(result).toHaveProperty('products');
    expect(result).toHaveProperty('total');
    expect(result.products.length).toBeGreaterThan(0);
  });

  it('findAll with query filter should return filtered products', async () => {
    const result = await productRepository.findAll({ query: 'Producto Test' });
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.products[0].name).toBe('Producto Test');
  });

  it('findAll with type filter should return filtered products', async () => {
    const result = await productRepository.findAll({ type: 'PRODUCTO' });
    expect(result.products.length).toBeGreaterThan(0);
    expect(result.products[0].type).toBe('PRODUCTO');
  });

  it('findById should return a product', async () => {
    const product = await productRepository.findById(productId);
    expect(product).toBeDefined();
    expect(product?.id).toBe(productId);
  });

  it('findBySku should return a product', async () => {
    const product = await productRepository.findBySku('TEST-001');
    expect(product).toBeDefined();
    expect(product?.sku).toBe('TEST-001');
  });

  it('findLowStock should return low stock products', async () => {
    const products = await productRepository.findLowStock(10);
    expect(Array.isArray(products)).toBe(true);
    expect(products.some(p => p.id === productId)).toBe(true);
  });

  it('update should modify product info', async () => {
    const updated = await productRepository.update(productId, {
      name: 'Producto Modificado'
    });
    expect(updated.name).toBe('Producto Modificado');
  });

  it('updateStock should increase stock', async () => {
    const before = await productRepository.findById(productId);
    await productRepository.updateStock(productId, 3);
    const after = await productRepository.findById(productId);
    expect(after!.stockQty).toBe(before!.stockQty + 3);
  });

  it('delete should set isActive false', async () => {
    const deleted = await productRepository.delete(productId);
    expect(deleted.isActive).toBe(false);
  });
});

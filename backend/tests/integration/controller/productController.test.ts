import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

import { productController } from '../../../src/controllers/productController';
import { productRepository } from '../../../src/repositories/productRepository';
import { stockService } from '../../../src/services/stockService';
import Decimal from 'decimal.js';
import { Product, ProductType } from '@prisma/client';

vi.mock('../../../src/repositories/productRepository', () => ({
  productRepository: {
    findAll: vi.fn(),
    findById: vi.fn(),
    findLowStock: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock('../../../src/services/stockService', () => ({
  stockService: {
    adjustStock: vi.fn(),
    getMovements: vi.fn()
  }
}));

const productMock = (overrides = {}) => ({
  id: 1,
  name: 'Test Product',
  sku: 'SKU1',
  type: ProductType.PRODUCTO,
  cost: new Decimal(10.0),
  unitPrice: new Decimal(20.0),
  stockQty: 5,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

const mockedProductRepository = vi.mocked(productRepository, true);
const mockedStockService = vi.mocked(stockService, true);

const app = express();
app.use(express.json());

// Fake auth req
app.use((req: any, _res, next) => {
  req.user = { userId: 1 };
  next();
});

// Routes
app.get('/products', productController.getAll);
app.get('/products/low-stock', productController.getLowStock);
app.get('/products/:id', productController.getById);
app.post('/products', productController.create);
app.put('/products/:id', productController.update);
app.delete('/products/:id', productController.delete);
app.post('/products/:id/stock', productController.adjustStock);
app.get('/products/:id/stock/movements', productController.getStockMovements);

describe('productController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------- GET ALL --------
  it('returns products', async () => {
    mockedProductRepository.findAll.mockResolvedValue({ 
      products: [],
      total: 0,
      page: 1,
      size: 10
    });

    const res = await request(app).get('/products');

    expect(res.status).toBe(200);
    expect(mockedProductRepository.findAll).toHaveBeenCalled();
  });

  // -------- GET BY ID --------
  it('returns product by id', async () => {
    mockedProductRepository.findById.mockResolvedValue(productMock());

    const res = await request(app).get('/products/1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(1);
  });

  it('returns 404 if product not found', async () => {
    mockedProductRepository.findById.mockResolvedValue(null);

    const res = await request(app).get('/products/999');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Producto no encontrado');
  });

  // -------- LOW STOCK --------
  it('returns low stock products', async () => {
    mockedProductRepository.findLowStock.mockResolvedValue([productMock()]);

    const res = await request(app).get('/products/low-stock?threshold=5');

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });

  // -------- CREATE --------
  it('creates product', async () => {
    mockedProductRepository.create.mockResolvedValue(productMock());

    const res = await request(app).post('/products').send({
      name: 'Test',
      sku: 'SKU1',
      type: 'PRODUCTO',
      cost: 1,
      unitPrice: 2
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(1);
  });

  it('returns 400 on invalid create', async () => {
    const res = await request(app).post('/products').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  // -------- UPDATE --------
  it('updates product', async () => {
    mockedProductRepository.update.mockResolvedValue(productMock({ name: 'Updated' }));

    const res = await request(app).put('/products/1').send({
      name: 'Updated'
    });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated');
  });

  it('returns 400 on invalid update', async () => {
    const res = await request(app).put('/products/1').send({ cost: -5 });
    expect(res.status).toBe(400);
  });

  // -------- DELETE --------
  it('deletes product', async () => {
    const res = await request(app).delete('/products/1');

    expect(res.status).toBe(204);
    expect(productRepository.delete).toHaveBeenCalledWith(1);
  });

  // -------- STOCK ADJUST --------
  it('adjusts stock', async () => {
    mockedStockService.adjustStock.mockResolvedValue(productMock({ stockQty: 5 }));

    const res = await request(app).post('/products/1/stock').send({
      type: 'IN',
      qty: 5
    });

    expect(res.status).toBe(200);
    expect(res.body.stockQty).toBe(5);
  });

  it('returns 400 on invalid stock adjust', async () => {
    const res = await request(app).post('/products/1/stock').send({
      qty: -2
    });

    expect(res.status).toBe(400);
  });

  // -------- STOCK MOVEMENTS --------
  it('returns stock movements', async () => {
    mockedStockService.getMovements.mockResolvedValue([{
      id: 1,
      product: productMock(),
      type: 'IN' as any,
      qty: 5,
      productId: 1,
      note: null,
      createdAt: new Date()
    }] as any);

    const res = await request(app).get('/products/1/stock/movements');

    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
  });
});

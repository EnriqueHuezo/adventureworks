import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

import { invoiceController } from '../../../src/controllers/invoiceController';
import { invoiceService } from '../../../src/services/invoiceService';
import Decimal from 'decimal.js';
import { ClientType, InvoiceStatus, InvoiceType, PaymentMethod, ProductType } from '@prisma/client';
import { roundMoney } from '../../../src/utils/money';

vi.mock('../../../src/services/invoiceService', () => ({
  invoiceService: {
    preview: vi.fn(),
    create: vi.fn(),
    getAll: vi.fn(),
    getById: vi.fn(),
    void: vi.fn(),
    getTodayByUser: vi.fn(),
    getDashboardMetrics: vi.fn()
  }
}));

const mockedInvoiceService = vi.mocked(invoiceService, true);

const mockInvoice = (overrides = {}) => ({
  id: 2,
  numeroControlDTE: 'DTE-01-S001P001-FAC-000000000000002',
  codeGeneracion: '2F0F8784-E7CF-4A25-B752-6CDCA00B5F50',
  numeroControl: 'FAC-00000002',
  selloRecepcion: '21BB756C82A8BC5F854F94E3D898A1AF',
  issueDate: new Date('2025-11-04T00:00:00.000Z'),
  series: 'FAC',
  branchId: 1,
  type: InvoiceType.FACTURA,
  status: InvoiceStatus.EMITIDA,
  categoria: null,
  clientId: 1,
  userId: 1,
  subtotal: new Decimal(8.99),
  iva13: new Decimal(1.17),
  retencionRenta10: new Decimal(0.9),
  retencionIva1: new Decimal(0.01),
  total: new Decimal(9.25),
  paymentMethod: PaymentMethod.EFECTIVO,
  observations: null,
  createdAt: new Date('2025-11-04T21:05:53.188Z'),
  client: {
    id: 1,
    name: 'Juan Pérez García',
    tipoCliente: ClientType.NATURAL,
    email: 'juan.perez@email.com',
    phone: '7890-1234',
    address: 'Col. Escalón, San Salvador',
    nit: '0614-120389-001-4',
    nrc: null,
    dui: '03456789-0',
    actividadEconomica: null,
    nombreComercial: null,
    isActive: true,
    createdAt: new Date('2025-10-27T00:44:14.879Z'),
    updatedAt: new Date('2025-10-27T00:44:14.879Z')
  },
  branch: {
    id: 1,
    name: 'Sucursal Centro',
    code: 'SUC001',
    address: 'Av. Principal #123, San Salvador'
  },
  user: {
    id: 1,
    email: 'admin@billing.com',
    username: 'admin',
    password: '$2a$10$eZAwQQRIlQ3haog7ysJV0OZ1rckyvDKBN95WRaAHkN06mZtdUskka',
    fullName: 'Administrador Principal',
    isActive: true,
    branchId: 1,
    createdAt: new Date('2025-10-27T00:44:14.836Z'),
    updatedAt: new Date('2025-10-27T00:44:14.836Z')
  },
  items: [
    {
      id: 2,
      invoiceId: 2,
      productId: 5,
      qty: 1,
      cost: new Decimal(3.5),
      unitPrice: new Decimal(8.99),
      discount: new Decimal(0),
      subtotal: new Decimal(8.99),
      product: {
        id: 1,
        sku: 'P001',
        name: 'Producto 1',
        type: ProductType.PRODUCTO,
        cost: new Decimal(50),
        unitPrice: new Decimal(50),
        stockQty: 100,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    }
  ],
  ...overrides
});

const app = express();
app.use(express.json());

// Fake auth middleware to inject req.user
app.use((req: any, _res, next) => {
  req.user = { userId: 1, roles: ['ADMIN'] };
  next();
});

app.post('/invoices/preview', invoiceController.preview);
app.post('/invoices', invoiceController.create);
app.get('/invoices', invoiceController.getAll);
app.get('/invoices/dashboard', invoiceController.getDashboardMetrics);
app.get('/invoices/:id', invoiceController.getById);
app.post('/invoices/:id/void', invoiceController.void);
app.get('/invoices/history/today', invoiceController.getTodayHistory);

describe('invoiceController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------- PREVIEW --------
  it('returns invoice preview', async () => {
    mockedInvoiceService.preview.mockResolvedValue({ total: new Decimal(100), items: [], iva13: new Decimal(0), retencionIva1: new Decimal(0), retencionRenta10: new Decimal(0), subtotal: new Decimal(0) });

    const res = await request(app)
      .post('/invoices/preview')
      .send({
        branchId: 1,
        series: 'A',
        type: 'FACTURA',
        clientId: 1,
        userId: 1,
        items: [{ productId: 1, qty: 2 }],
        applyRetencionRenta: false,
        applyRetencionIva: false,
        paymentMethod: 'EFECTIVO'
      });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe("100");
  });

  it('returns 400 on invalid preview data', async () => {
    const res = await request(app)
      .post('/invoices/preview')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  // -------- CREATE --------
  it('creates an invoice', async () => {
    mockedInvoiceService.create.mockResolvedValue(mockInvoice());

    const res = await request(app)
      .post('/invoices')
      .send({
        branchId: 1,
        series: 'A',
        type: 'FACTURA',
        clientId: 1,
        userId: 1,
        items: [{ productId: 1, qty: 2 }],
        applyRetencionRenta: false,
        applyRetencionIva: false,
        paymentMethod: 'EFECTIVO',
        issueDate: "2024-01-01"
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(2);
  });

  it('returns 400 on invalid invoice creation', async () => {
    const res = await request(app)
      .post('/invoices')
      .send({});
    
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Datos inválidos');
  });

  // -------- GET ALL --------
  it('returns paginated invoices', async () => {
    mockedInvoiceService.getAll.mockResolvedValue({
      invoices: [],
      total: 0,
      page: 1,
      size: 10
    });

    const res = await request(app).get('/invoices');

    expect(res.status).toBe(200);
    expect(mockedInvoiceService.getAll).toHaveBeenCalled();
  });

  // -------- GET BY ID --------
  it('returns invoice by id', async () => {
    mockedInvoiceService.getById.mockResolvedValue(mockInvoice());

    const res = await request(app).get('/invoices/1');

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(2);
  });

  it('returns 404 if invoice not found', async () => {
    mockedInvoiceService.getById.mockRejectedValue(new Error('Not found'));

    const res = await request(app).get('/invoices/999');

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });

  // -------- VOID --------
  it('voids an invoice', async () => {
    mockedInvoiceService.void.mockResolvedValue(mockInvoice({ status: InvoiceStatus.ANULADA }));

    const res = await request(app).post('/invoices/1/void');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(InvoiceStatus.ANULADA);
  });

  // -------- HISTORY TODAY --------
  it('returns today\'s invoices for user', async () => {
    mockedInvoiceService.getTodayByUser.mockResolvedValue({
      invoices: [mockInvoice()],
      metrics: {
        totalSales: roundMoney(10).toString(),
        invoiceCount: 1,
        lastInvoiceTime: new Date().toISOString()
      }
    });

    const res = await request(app).get('/invoices/history/today');

    expect(res.status).toBe(200);
    expect(res.body.invoices.length).toBe(1);
  });

  // -------- DASHBOARD --------
  it('returns dashboard metrics', async () => {
    mockedInvoiceService.getDashboardMetrics.mockResolvedValue({
      totalSales: roundMoney(1000).toString(),
      invoiceCount: 1,
      avgTicket: roundMoney(100).toString(),
      byType: {
        FACTURA: 1,
        NOTA_CREDITO: 0,
        NOTA_DEBITO: 0
      },
      byStatus: {
        EMITIDA: 1,
        ANULADA: 0,
        PAGADA: 0
      },
      dailySales: [{
        date: new Date().toISOString(),
        total: roundMoney(1000).toString()
      }]
    });

    const res = await request(app).get('/invoices/dashboard');

    expect(res.status).toBe(200);
    expect(res.body.totalSales).toBe("1000");
  });
});

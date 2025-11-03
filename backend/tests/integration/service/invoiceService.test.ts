import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { PrismaClient, InvoiceType, PaymentMethod, ProductType } from '@prisma/client';
import { InvoiceCreateData, InvoicePreviewData, invoiceService } from '../../../src/services/invoiceService';
import { Decimal } from 'decimal.js';

const prisma = new PrismaClient();

describe('Invoice service', () => {
  let clientId: number;
  let branchId: number;
  let userId: number;
  let productId: number;
  let invoiceId: number;

  beforeAll(async () => {
    const client = await prisma.client.create({ 
      data: { 
        name: 'Test Client invoice', 
        email: 'client@test.com', 
        phone: '1234', 
        address: 'Street 1', 
        nit: '0614-123456-789-0', 
        nrc: '123456-7', 
        dui: '9999999-9', 
        isActive: true 
      }
    });

    clientId = client.id;

    const branch = await prisma.branch.create({ 
      data: { 
        name: 'Test Branch invoice', 
        code: 'TB001', 
        address: 'Branch St' 
      } 
    });
    branchId = branch.id;

    const user = await prisma.user.create({ 
      data: { 
        username: 'testuser invoice', 
        email: 'user@test.com', 
        password: 'pass', 
        fullName: 'Test User', 
        branchId: branch.id, 
        roles: { create: [] } 
      } 
    });
    userId = user.id;

    const product = await prisma.product.create({ 
      data: { 
        name: 'Test Product', 
        sku: 'TP001', 
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
    await prisma.invoice.deleteMany({ where: { id: invoiceId } });
    await prisma.stockMovement.deleteMany({ where: { productId } });
    await prisma.product.deleteMany({ where: { id: productId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.branch.deleteMany({ where: { id: branchId } });
    await prisma.client.deleteMany({ where: { id: clientId } });
    await prisma.$disconnect();
  });

  it('should create an invoice', async () => {
    const invoice = await invoiceService.create({
      branchId,
      series: 'FAC',
      type: InvoiceType.FACTURA,
      clientId,
      userId,
      items: [{ productId, qty: 2 }],
      applyRetencionRenta: true,
      applyRetencionIva: true,
      paymentMethod: PaymentMethod.EFECTIVO,
      issueDate: new Date()
    });

    invoiceId = invoice.id;
    expect(invoice.id).toBeDefined();
    expect(invoice.items.length).toBe(1);
  });

  it('should preview invoice correctly', async () => {
    const preview = await invoiceService.preview({
      branchId,
      series: 'FAC',
      type: InvoiceType.FACTURA,
      clientId,
      userId,
      items: [{ productId, qty: 2 }],
      applyRetencionRenta: true,
      applyRetencionIva: true,
      paymentMethod: PaymentMethod.EFECTIVO
    });

    expect(preview.total.toNumber()).toBeGreaterThan(0);
    expect(preview.items.length).toBe(1);
  });

  it('should increment existing sequence', async () => {
  // Create a sequence first
    await prisma.sequence.create({ data: { branchId, series: 'SEQ', nextValue: 5 } });

    const value = await invoiceService.getNextSequenceValue(prisma, branchId, 'SEQ');
    expect(value).toBe(5); // returns current value

    const updated = await prisma.sequence.findUnique({ 
      where: { branchId_series: { branchId, series: 'SEQ' } } 
    });
    expect(updated?.nextValue).toBe(6); // nextValue incremented

    // Clean up
    await prisma.sequence.deleteMany({ where: { branchId, series: 'SEQ' } });
  });

  it('should get invoice by id', async () => {
    const invoice = await invoiceService.getById(invoiceId);
    expect(invoice.id).toBe(invoiceId);
  });

  it('getTodayByUser should return invoices for today', async () => {
    const result = await invoiceService.getTodayByUser(userId);
    expect(result.invoices.length).toBeGreaterThan(0);
  });

  it('should return dashboard metrics', async () => {
    const metrics = await invoiceService.getDashboardMetrics(branchId);
    expect(Number(metrics.totalSales)).toBeGreaterThanOrEqual(0);
    expect(metrics.invoiceCount).toBeGreaterThanOrEqual(0);
  });

  it('should void an invoice and restore stock', async () => {
    await invoiceService.void(invoiceId);
    const findedInvoice = await invoiceService.getById(invoiceId);
    expect(findedInvoice.status).toBe('ANULADA');

    const product = await prisma.product.findUnique({ where: { id: productId }});
    expect(product?.stockQty).toBe(100); // original stock restored
  });

  it('should return dashboard metrics after voiding an invoice', async () => {
    const metrics = await invoiceService.getDashboardMetrics(branchId);
    expect(Number(metrics.totalSales)).toBeGreaterThanOrEqual(0);
    expect(metrics.invoiceCount).toBeGreaterThanOrEqual(0);
  });

  it('preview throws error if product not found', async () => {
    const data: InvoicePreviewData = {
      branchId: 1,
      series: 'FAC',
      type: 'FACTURA',
      clientId: 1,
      userId: 1,
      items: [{ productId: -1, qty: 1 }], // invalid productId
      applyRetencionRenta: true,
      applyRetencionIva: true,
      paymentMethod: 'EFECTIVO'
    };

    await expect(invoiceService.preview(data)).rejects.toThrow(/Producto no encontrado/);
  });

  it('preview returns Decimal(0) for retentions if flags false', async () => {
    const data: InvoicePreviewData = {
      branchId: 1,
      series: 'FAC',
      type: 'FACTURA',
      clientId: 1,
      userId: 1,
      items: [], // no items
      applyRetencionRenta: false,
      applyRetencionIva: false,
      paymentMethod: 'EFECTIVO'
    };

    const result = await invoiceService.preview(data);
    expect(result.retencionRenta10.toNumber()).toBe(0);
    expect(result.retencionIva1.toNumber()).toBe(0);
  });

  it('create throws error if branch not found', async () => {
    const data: InvoiceCreateData = {
      branchId: -1, // invalid branchId
      series: 'FAC',
      type: 'FACTURA',
      clientId: 1,
      userId: 1,
      items: [],
      applyRetencionRenta: false,
      applyRetencionIva: false,
      paymentMethod: 'EFECTIVO',
      issueDate: new Date()
    };

    await expect(invoiceService.create(data)).rejects.toThrow(/Sucursal no encontrada/);
  });

  it.fails('should throw error if numeroControlDTE already exists', async () => {
    const validData: InvoiceCreateData = {
      branchId: 1,
      series: 'FAC',
      type: InvoiceType.FACTURA,
      clientId: 1,
      userId: 1,
      items: [],
      applyRetencionRenta: false,
      applyRetencionIva: false,
      paymentMethod: PaymentMethod.EFECTIVO,
      issueDate: new Date()
    };

    // First create succeeds
    await invoiceService.create(validData);

    // Second create should fail
    await invoiceService.create(validData);
  });

  it('getAll should return paginated invoices', async () => {
    const result = await invoiceService.getAll({
      branchId,
    });
    expect(result.invoices.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it('getById should fail if invoiceId not found', async () => {
    await expect(invoiceService.getById(-1)).rejects.toThrow(/Factura no encontrada/);
  });

  it('void should fail if invoiceId not found', async () => {
    await expect(invoiceService.void(-1)).rejects.toThrow(/Factura no encontrada/);
  });

  it('void should fail if invoice already voided', async () => {
    await expect(invoiceService.void(invoiceId)).rejects.toThrow(/La factura ya está anulada/);
  });
});
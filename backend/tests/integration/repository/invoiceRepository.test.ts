import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaClient, InvoiceStatus, InvoiceType, PaymentMethod } from '@prisma/client';
import { invoiceRepository } from '../../../src/repositories/invoiceRepository';
import { getTodayStart, getTodayEnd } from '../../../src/utils/dates';

const prisma = new PrismaClient();

describe('Invoice repository', () => {
  let testInvoiceId: number;
  let testClientId: number;
  let testBranchId: number;
  let testUserId: number;

  beforeAll(async () => {
    // Create necessary test data: client, branch, and user
    const client = await prisma.client.create({
      data: {
        name: 'Invoice Test Client',
        email: 'invoice.client@test.com',
        phone: '1234-5678',
        address: 'Test Street 123',
        nit: '0614-123456-789-0',
        nrc: '123456-7',
        dui: '01234567-8',
        isActive: true
      }
    });
    testClientId = client.id;

    const branch = await prisma.branch.create({
      data: { name: 'Invoice Test Branch', code: 'TEST001', address: 'Branch Street 1' }
    });
    testBranchId = branch.id;

    const user = await prisma.user.create({
      data: {
        username: 'invoiceuser',
        email: 'invoice.user@test.com',
        password: 'password123',
        fullName: 'Invoice User',
        branchId: branch.id,
        roles: { create: [] }
      }
    });
    testUserId = user.id;
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.invoice.deleteMany({ where: { clientId: testClientId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.branch.deleteMany({ where: { id: testBranchId } });
    await prisma.client.deleteMany({ where: { id: testClientId } });
    await prisma.$disconnect();
  });

  it('create should add a new invoice', async () => {
    const invoice = await invoiceRepository.create({
      numeroControl: 'INV-0001',
      codeGeneracion: 'CG-001',
      issueDate: new Date(),
      series: 'FAC',
      numeroControlDTE: 'DTE-0001',
      selloRecepcion: '',
      client: { connect: { id: testClientId } },
      branch: { connect: { id: testBranchId } },
      user: { connect: { id: testUserId } },
      type: InvoiceType.FACTURA,
      status: InvoiceStatus.EMITIDA,
      paymentMethod: PaymentMethod.EFECTIVO,
      subtotal: 100,
      iva13: 13,
      retencionRenta10: 10,
      retencionIva1: 1,
      total: 102
    });
    testInvoiceId = invoice.id;
    expect(invoice).toBeDefined();
    expect(invoice.id).toBeDefined();
  });

  it('findAll should return invoices', async () => {
    const result = await invoiceRepository.findAll({});
    expect(result.invoices.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it('findAll with filters should work', async () => {
    const result = await invoiceRepository.findAll({ clientId: testClientId });
    expect(result.invoices.length).toBeGreaterThan(0);
    expect(result.invoices[0].clientId).toBe(testClientId);
  });

  it('findAll with query search should work', async () => {
    const result = await invoiceRepository.findAll({ q: "Invoice Test Client" });
    expect(result.invoices.length).toBeGreaterThan(0);
    expect(result.invoices[0].clientId).toBe(testClientId);
  });

  it('findAll with dateFrom only should return invoices', async () => {
    const fromDate = new Date(new Date().setDate(new Date().getDate() - 1));
    const result = await invoiceRepository.findAll({ dateFrom: fromDate });
    expect(result.invoices.length).toBeGreaterThan(0);
  });

  it('findAll with dateTo only should return invoices', async () => {
    const toDate = new Date(new Date().setDate(new Date().getDate() + 1));
    const result = await invoiceRepository.findAll({ dateTo: toDate });
    expect(result.invoices.length).toBeGreaterThan(0);
  });

  it('findAll with dateFrom and dateTo should return invoices', async () => {
    const fromDate = new Date(new Date().setDate(new Date().getDate() - 1));
    const toDate = new Date(new Date().setDate(new Date().getDate() + 1));
    const result = await invoiceRepository.findAll({ dateFrom: fromDate, dateTo: toDate });
    expect(result.invoices.length).toBeGreaterThan(0);
  });

  it('findAll with full filters should work', async () => {
    const result = await invoiceRepository.findAll({
      type: InvoiceType.FACTURA,
      status: InvoiceStatus.EMITIDA,
      paymentMethod: PaymentMethod.EFECTIVO,
      clientId: testClientId,
      branchId: testBranchId,
      dateFrom: new Date(new Date().setDate(new Date().getDate() - 1)),
      dateTo: new Date(new Date().setDate(new Date().getDate() + 1))
    });
    expect(result.invoices.length).toBeGreaterThan(0);
    expect(result.invoices[0].clientId).toBe(testClientId);
    expect(result.invoices[0].branchId).toBe(testBranchId);
    expect(result.invoices[0].userId).toBe(testUserId);
  });

  it('findById should return an invoice', async () => {
    const invoice = await invoiceRepository.findById(testInvoiceId);
    expect(invoice).toBeDefined();
    expect(invoice?.id).toBe(testInvoiceId);
    expect(invoice?.items).toBeDefined();
  });

  it('findTodayByUser should return invoices for today', async () => {
    const invoices = await invoiceRepository.findTodayByUser(testUserId);
    const todayStart = getTodayStart();
    const todayEnd = getTodayEnd();
    expect(invoices.length).toBeGreaterThan(0);
    expect(invoices[0].issueDate >= todayStart && invoices[0].issueDate <= todayEnd).toBe(true);
  });

  it('getDashboardMetrics should return metrics', async () => {
    const metrics = await invoiceRepository.getDashboardMetrics(testBranchId);
    expect(metrics.invoiceCount).toBeGreaterThan(0);
    expect(Number(metrics.totalSales)).toBeGreaterThanOrEqual(0);
    expect(metrics.invoices).toBeInstanceOf(Array);
  });

  it('getDashboardMetrics filter by date should return metrics', async () => {
    const metrics = await invoiceRepository.getDashboardMetrics(testBranchId, new Date(new Date().setDate(new Date().getDate() - 1)),
      new Date(new Date().setDate(new Date().getDate() + 1))
    );
    expect(metrics.invoiceCount).toBeGreaterThan(0);
    expect(Number(metrics.totalSales)).toBeGreaterThanOrEqual(0);
    expect(metrics.invoices).toBeInstanceOf(Array);
  });

  it('getDashboardMetrics return metrics', async () => {
    const metrics = await invoiceRepository.getDashboardMetrics();
    expect(metrics.invoiceCount).toBeGreaterThan(0);
    expect(Number(metrics.totalSales)).toBeGreaterThanOrEqual(0);
    expect(metrics.invoices).toBeInstanceOf(Array);
  });

  it('getDashboardMetrics filter by dateFrom should return metrics', async () => {
    const metrics = await invoiceRepository.getDashboardMetrics(testBranchId, new Date(new Date().setDate(new Date().getDate() - 1))
    );
    expect(metrics.invoiceCount).toBeGreaterThan(0);
    expect(Number(metrics.totalSales)).toBeGreaterThanOrEqual(0);
    expect(metrics.invoices).toBeInstanceOf(Array);
  });

  it('getDashboardMetrics filter by dateTo should return metrics', async () => {
    const metrics = await invoiceRepository.getDashboardMetrics(testBranchId, undefined,
      new Date(new Date().setDate(new Date().getDate() + 1))
    );
    expect(metrics.invoiceCount).toBeGreaterThan(0);
    expect(Number(metrics.totalSales)).toBeGreaterThanOrEqual(0);
    expect(metrics.invoices).toBeInstanceOf(Array);
  });

  it('getDashboardMetrics filter by dateTo should return metrics', async () => {
    const metrics = await invoiceRepository.getDashboardMetrics(9999);
    expect(Number(metrics.totalSales)).toEqual(0);
    expect(metrics.invoices).toBeInstanceOf(Array);
  });
  
  it('void should change status to ANULADA', async () => {
    const invoice = await invoiceRepository.void(testInvoiceId);
    expect(invoice.status).toBe('ANULADA');
  });

  // ----------------------
  // Expected failures
  // ----------------------

  it('void non-existing invoice should fail', async () => {
    await expect(invoiceRepository.void(-1)).rejects.toThrow();
  });
});

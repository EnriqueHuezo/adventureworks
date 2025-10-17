import { Decimal } from 'decimal.js';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import { InvoiceType, PaymentMethod, ProductType } from '@prisma/client';
import { invoiceRepository, InvoiceFilters } from '../repositories/invoiceRepository';
import { sequenceRepository } from '../repositories/sequenceRepository';
import { productRepository } from '../repositories/productRepository';
import { PrismaClient } from '@prisma/client';
import {
  calculateSubtotal,
  calculateIVA,
  calculateRetencionRenta,
  calculateRetencionIVA,
  calculateTotal,
  roundMoney
} from '../utils/money';
import { generateNumeroControl, generateNumeroControlDTE } from '../utils/numbers';

const prisma = new PrismaClient();

export interface InvoiceItem {
  productId: number;
  qty: number;
  discount?: number;
}

export interface InvoicePreviewData {
  branchId: number;
  series: string;
  type: InvoiceType;
  clientId: number;
  userId: number;
  items: InvoiceItem[];
  applyRetencionRenta: boolean;
  applyRetencionIva: boolean;
  paymentMethod: PaymentMethod;
  observations?: string;
}

export interface InvoiceCreateData extends InvoicePreviewData {
  issueDate: Date;
}

export const invoiceService = {
  async preview(data: InvoicePreviewData) {
    // Get all products with current prices
    const products = await Promise.all(
      data.items.map(item => productRepository.findById(item.productId))
    );

    // Calculate line items
    let subtotalGlobal = new Decimal(0);
    const lineItems = data.items.map((item, index) => {
      const product = products[index];
      if (!product) throw new Error(`Producto no encontrado: ${item.productId}`);

      const discount = new Decimal(item.discount || 0);
      const subtotal = calculateSubtotal(item.qty, product.unitPrice, discount);
      subtotalGlobal = subtotalGlobal.plus(subtotal);

      return {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        qty: item.qty,
        cost: product.cost,
        unitPrice: product.unitPrice,
        discount,
        subtotal
      };
    });

    // Calculate taxes and retentions
    const iva13 = calculateIVA(subtotalGlobal);
    const retencionRenta10 = data.applyRetencionRenta ? calculateRetencionRenta(subtotalGlobal) : new Decimal(0);
    const retencionIva1 = data.applyRetencionIva ? calculateRetencionIVA(iva13) : new Decimal(0);
    const total = calculateTotal(subtotalGlobal, iva13, retencionRenta10, retencionIva1);

    return {
      items: lineItems,
      subtotal: subtotalGlobal,
      iva13,
      retencionRenta10,
      retencionIva1,
      total
    };
  },

  async create(data: InvoiceCreateData) {
    return prisma.$transaction(async (tx) => {
      // Get preview calculations
      const preview = await this.preview(data);

      // Get branch information for numeroControlDTE
      const branch = await tx.branch.findUnique({
        where: { id: data.branchId }
      });
      if (!branch) throw new Error('Sucursal no encontrada');

      // Get next sequence number
      const sequential = await sequenceRepository.getNextValue(data.branchId, data.series);
      const numeroControl = generateNumeroControl(data.series, sequential);
      const numeroControlDTE = generateNumeroControlDTE(branch.code, sequential);

      // Generate unique codes
      const codeGeneracion = uuidv4().toUpperCase();
      const selloRecepcion = crypto.randomBytes(16).toString('hex').toUpperCase();

      // Get products
      const products = await Promise.all(
        data.items.map(item => productRepository.findById(item.productId))
      );

      // Create invoice
      const invoice = await tx.invoice.create({
        data: {
          numeroControlDTE,
          codeGeneracion,
          numeroControl,
          selloRecepcion,
          issueDate: data.issueDate,
          series: data.series,
          type: data.type,
          branchId: data.branchId,
          clientId: data.clientId,
          userId: data.userId,
          subtotal: preview.subtotal,
          iva13: preview.iva13,
          retencionRenta10: preview.retencionRenta10,
          retencionIva1: preview.retencionIva1,
          total: preview.total,
          paymentMethod: data.paymentMethod,
          observations: data.observations,
          items: {
            create: data.items.map((item, index) => {
              const product = products[index];
              if (!product) throw new Error(`Producto no encontrado: ${item.productId}`);

              const discount = new Decimal(item.discount || 0);
              const subtotal = calculateSubtotal(item.qty, product.unitPrice, discount);

              return {
                productId: product.id,
                qty: item.qty,
                cost: product.cost,
                unitPrice: product.unitPrice,
                discount,
                subtotal
              };
            })
          }
        },
        include: {
          client: true,
          branch: true,
          user: true,
          items: {
            include: {
              product: true
            }
          }
        }
      });

      // Update stock for products (not services)
      for (let i = 0; i < data.items.length; i++) {
        const item = data.items[i];
        const product = products[i];

        if (product && product.type === ProductType.PRODUCTO) {
          await tx.product.update({
            where: { id: product.id },
            data: {
              stockQty: {
                decrement: item.qty
              }
            }
          });

          await tx.stockMovement.create({
            data: {
              productId: product.id,
              type: 'OUT',
              qty: item.qty,
              note: `Factura ${numeroControl}`
            }
          });
        }
      }

      return invoice;
    });
  },

  async getAll(filters: InvoiceFilters) {
    return invoiceRepository.findAll(filters);
  },

  async getById(id: number) {
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) {
      throw new Error('Factura no encontrada');
    }
    return invoice;
  },

  async void(id: number) {
    return prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true
            }
          }
        }
      });

      if (!invoice) {
        throw new Error('Factura no encontrada');
      }

      if (invoice.status === 'ANULADA') {
        throw new Error('La factura ya está anulada');
      }

      // Update invoice status
      await tx.invoice.update({
        where: { id },
        data: { status: 'ANULADA' }
      });

      // Reverse stock movements
      for (const item of invoice.items) {
        if (item.product.type === ProductType.PRODUCTO) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stockQty: {
                increment: item.qty
              }
            }
          });

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'IN',
              qty: item.qty,
              note: `Anulación factura ${invoice.numeroControl}`
            }
          });
        }
      }

      return invoiceRepository.findById(id);
    });
  },

  async getTodayByUser(userId: number) {
    const invoices = await invoiceRepository.findTodayByUser(userId);

    const totalSales = invoices.reduce((sum, inv) => {
      return sum.plus(new Decimal(inv.total));
    }, new Decimal(0));

    const lastInvoice = invoices[0] || null;

    return {
      invoices,
      metrics: {
        totalSales: roundMoney(totalSales).toString(),
        invoiceCount: invoices.length,
        lastInvoiceTime: lastInvoice ? lastInvoice.issueDate.toISOString() : null
      }
    };
  },

  async getDashboardMetrics(branchId?: number, dateFrom?: Date, dateTo?: Date) {
    const data = await invoiceRepository.getDashboardMetrics(branchId, dateFrom, dateTo);

    const totalSales = new Decimal(data.totalSales);
    const avgTicket = data.invoiceCount > 0 
      ? totalSales.dividedBy(data.invoiceCount) 
      : new Decimal(0);

    // Group by type
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const dailySales: Record<string, Decimal> = {};

    for (const inv of data.invoices) {
      byType[inv.type] = (byType[inv.type] || 0) + 1;
      byStatus[inv.status] = (byStatus[inv.status] || 0) + 1;

      const dateKey = inv.issueDate.toISOString().split('T')[0];
      dailySales[dateKey] = (dailySales[dateKey] || new Decimal(0)).plus(inv.total);
    }

    return {
      totalSales: roundMoney(totalSales).toString(),
      invoiceCount: data.invoiceCount,
      avgTicket: roundMoney(avgTicket).toString(),
      byType,
      byStatus,
      dailySales: Object.entries(dailySales).map(([date, total]) => ({
        date,
        total: roundMoney(total).toString()
      }))
    };
  }
};


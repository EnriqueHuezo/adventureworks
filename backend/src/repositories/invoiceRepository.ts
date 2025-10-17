import { PrismaClient, Prisma, InvoiceType, InvoiceStatus, PaymentMethod } from '@prisma/client';
import { getTodayStart, getTodayEnd } from '../utils/dates';

const prisma = new PrismaClient();

export interface InvoiceFilters {
  dateFrom?: Date;
  dateTo?: Date;
  type?: InvoiceType;
  status?: InvoiceStatus;
  clientId?: number;
  branchId?: number;
  paymentMethod?: PaymentMethod;
  q?: string;
  page?: number;
  size?: number;
}

export const invoiceRepository = {
  async findAll(filters: InvoiceFilters) {
    const { dateFrom, dateTo, type, status, clientId, branchId, paymentMethod, q, page = 1, size = 25 } = filters;
    const skip = (page - 1) * size;

    const where: Prisma.InvoiceWhereInput = {};

    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) where.issueDate.gte = dateFrom;
      if (dateTo) where.issueDate.lte = dateTo;
    }

    if (type) where.type = type;
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (branchId) where.branchId = branchId;
    if (paymentMethod) where.paymentMethod = paymentMethod;

    if (q) {
      where.OR = [
        { numeroControl: { contains: q, mode: 'insensitive' } },
        { codeGeneracion: { contains: q, mode: 'insensitive' } },
        { client: { name: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        skip,
        take: size,
        include: {
          client: true,
          branch: true,
          user: {
            select: {
              id: true,
              username: true,
              fullName: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.invoice.count({ where })
    ]);

    return { invoices, total, page, size };
  },

  async findById(id: number) {
    return prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        branch: true,
        user: {
          select: {
            id: true,
            username: true,
            fullName: true,
            email: true
          }
        },
        items: {
          include: {
            product: true
          }
        }
      }
    });
  },

  async findTodayByUser(userId: number) {
    const start = getTodayStart();
    const end = getTodayEnd();

    return prisma.invoice.findMany({
      where: {
        userId,
        issueDate: {
          gte: start,
          lte: end
        },
        status: 'EMITIDA'
      },
      include: {
        client: true,
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  },

  async create(data: Prisma.InvoiceCreateInput) {
    return prisma.invoice.create({
      data,
      include: {
        client: true,
        branch: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });
  },

  async void(id: number) {
    return prisma.invoice.update({
      where: { id },
      data: { status: 'ANULADA' }
    });
  },

  async getDashboardMetrics(branchId?: number, dateFrom?: Date, dateTo?: Date) {
    const where: Prisma.InvoiceWhereInput = {
      status: 'EMITIDA'
    };

    if (branchId) where.branchId = branchId;
    if (dateFrom || dateTo) {
      where.issueDate = {};
      if (dateFrom) where.issueDate.gte = dateFrom;
      if (dateTo) where.issueDate.lte = dateTo;
    }

    const [totalSales, invoiceCount, invoices] = await Promise.all([
      prisma.invoice.aggregate({
        where,
        _sum: {
          total: true
        }
      }),
      prisma.invoice.count({ where }),
      prisma.invoice.findMany({
        where,
        select: {
          type: true,
          status: true,
          total: true,
          issueDate: true
        }
      })
    ]);

    return {
      totalSales: totalSales._sum.total || 0,
      invoiceCount,
      invoices
    };
  }
};


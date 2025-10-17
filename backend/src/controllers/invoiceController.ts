import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { invoiceService } from '../services/invoiceService';
import { InvoiceType, PaymentMethod, InvoiceStatus } from '@prisma/client';

const invoiceItemSchema = z.object({
  productId: z.number().int().positive(),
  qty: z.number().int().positive(),
  discount: z.number().min(0).optional()
});

const invoicePreviewSchema = z.object({
  branchId: z.number().int().positive(),
  series: z.string().min(1),
  type: z.enum(['FACTURA', 'TICKET', 'CCF', 'EXPORTACION', 'NOTA_CREDITO', 'NOTA_DEBITO']),
  clientId: z.number().int().positive(),
  userId: z.number().int().positive(),
  items: z.array(invoiceItemSchema).min(1),
  applyRetencionRenta: z.boolean(),
  applyRetencionIva: z.boolean(),
  paymentMethod: z.enum(['EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'CREDITO']),
  observations: z.string().optional()
});

const invoiceCreateSchema = invoicePreviewSchema.extend({
  issueDate: z.string().transform(str => new Date(str))
});

export const invoiceController = {
  async preview(req: AuthRequest, res: Response) {
    try {
      const data = invoicePreviewSchema.parse(req.body);
      const preview = await invoiceService.preview(data);
      res.json(preview);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const data = invoiceCreateSchema.parse(req.body);
      const invoice = await invoiceService.create(data);
      res.status(201).json(invoice);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async getAll(req: AuthRequest, res: Response) {
    try {
      const filters = {
        dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined,
        dateTo: req.query.dateTo ? new Date(req.query.dateTo as string) : undefined,
        type: req.query.type as InvoiceType,
        status: req.query.status as InvoiceStatus,
        clientId: req.query.clientId ? parseInt(req.query.clientId as string) : undefined,
        branchId: req.query.branchId ? parseInt(req.query.branchId as string) : undefined,
        paymentMethod: req.query.paymentMethod as PaymentMethod,
        q: req.query.q as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        size: req.query.size ? parseInt(req.query.size as string) : 25
      };
      const result = await invoiceService.getAll(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const invoice = await invoiceService.getById(id);
      res.json(invoice);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },

  async void(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const invoice = await invoiceService.void(id);
      res.json(invoice);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getTodayHistory(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }
      const result = await invoiceService.getTodayByUser(req.user.userId);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getDashboardMetrics(req: AuthRequest, res: Response) {
    try {
      const branchId = req.query.branchId ? parseInt(req.query.branchId as string) : undefined;
      const dateFrom = req.query.dateFrom ? new Date(req.query.dateFrom as string) : undefined;
      const dateTo = req.query.dateTo ? new Date(req.query.dateTo as string) : undefined;

      const metrics = await invoiceService.getDashboardMetrics(branchId, dateFrom, dateTo);
      res.json(metrics);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};


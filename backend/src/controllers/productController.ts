import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { productRepository } from '../repositories/productRepository';
import { stockService } from '../services/stockService';
import { ProductType, StockType } from '@prisma/client';

const productSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  sku: z.string().min(1, 'SKU requerido'),
  type: z.enum(['SERVICIO', 'PRODUCTO']),
  cost: z.number().min(0, 'Costo debe ser positivo'),
  unitPrice: z.number().min(0, 'Precio debe ser positivo'),
  stockQty: z.number().int().min(0, 'Cantidad debe ser positiva').optional()
});

const stockAdjustmentSchema = z.object({
  type: z.enum(['IN', 'OUT', 'ADJUST']),
  qty: z.number().int().positive('Cantidad debe ser positiva'),
  note: z.string().optional()
});

export const productController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const filters = {
        query: req.query.query as string,
        type: req.query.type as ProductType,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        size: req.query.size ? parseInt(req.query.size as string) : 25
      };
      const result = await productRepository.findAll(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const product = await productRepository.findById(id);
      if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
      }
      res.json(product);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getLowStock(req: AuthRequest, res: Response) {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold as string) : 10;
      const products = await productRepository.findLowStock(threshold);
      res.json(products);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const data = productSchema.parse(req.body);
      const product = await productRepository.create(data);
      res.status(201).json(product);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async update(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const data = productSchema.partial().parse(req.body);
      const product = await productRepository.update(id, data);
      res.json(product);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async delete(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      await productRepository.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async adjustStock(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { type, qty, note } = stockAdjustmentSchema.parse(req.body);
      const product = await stockService.adjustStock(id, type as StockType, qty, note);
      res.json(product);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async getStockMovements(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const movements = await stockService.getMovements(id);
      res.json(movements);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};


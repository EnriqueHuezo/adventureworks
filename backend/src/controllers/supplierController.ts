import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { supplierRepository } from '../repositories/supplierRepository';

const supplierSchema = z.object({
  company: z.string().min(1, 'Empresa requerida'),
  contact: z.string().optional(),
  email: z.string().email('Email inválido').optional(),
  phone: z.string().optional()
});

export const supplierController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const filters = {
        q: req.query.q as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        size: req.query.size ? parseInt(req.query.size as string) : 25
      };
      const result = await supplierRepository.findAll(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const supplier = await supplierRepository.findById(id);
      if (!supplier) {
        return res.status(404).json({ error: 'Proveedor no encontrado' });
      }
      res.json(supplier);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const data = supplierSchema.parse(req.body);
      const supplier = await supplierRepository.create(data);
      res.status(201).json(supplier);
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
      const data = supplierSchema.parse(req.body);
      const supplier = await supplierRepository.update(id, data);
      res.json(supplier);
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
      await supplierRepository.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};


import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { clientRepository } from '../repositories/clientRepository';

const clientSchema = z.object({
  name: z.string().min(1, 'Nombre requerido'),
  tipoCliente: z.enum(['NATURAL', 'JURIDICA']).optional().default('NATURAL'),
  email: z.string().email('Email inválido').optional().nullable(),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  nit: z.string().optional().nullable(),
  nrc: z.string().optional().nullable(),
  dui: z.string().optional().nullable(),
  actividadEconomica: z.string().optional().nullable(),
  nombreComercial: z.string().optional().nullable()
});

export const clientController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const filters = {
        q: req.query.q as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        size: req.query.size ? parseInt(req.query.size as string) : 25
      };
      const result = await clientRepository.findAll(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const client = await clientRepository.findById(id);
      if (!client) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      res.json(client);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async lookup(req: AuthRequest, res: Response) {
    try {
      const dui = req.query.dui as string;
      if (!dui) {
        return res.status(400).json({ error: 'DUI requerido' });
      }
      const client = await clientRepository.findByDui(dui);
      if (!client) {
        return res.status(404).json({ error: 'Cliente no encontrado' });
      }
      res.json(client);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const data = clientSchema.parse(req.body);
      const client = await clientRepository.create(data);
      res.status(201).json(client);
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
      const data = clientSchema.parse(req.body);
      const client = await clientRepository.update(id, data);
      res.json(client);
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
      await clientRepository.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};


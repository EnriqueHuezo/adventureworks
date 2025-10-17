import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { branchRepository } from '../repositories/branchRepository';
import { sequenceRepository } from '../repositories/sequenceRepository';

const createSequenceSchema = z.object({
  series: z.string().min(1, 'Serie requerida')
});

export const branchController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const branches = await branchRepository.findAll();
      res.json(branches);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const branch = await branchRepository.findById(id);
      if (!branch) {
        return res.status(404).json({ error: 'Sucursal no encontrada' });
      }
      res.json(branch);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getSequences(req: AuthRequest, res: Response) {
    try {
      const branchId = parseInt(req.params.id);
      const sequences = await sequenceRepository.findByBranch(branchId);
      res.json(sequences);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async createSequence(req: AuthRequest, res: Response) {
    try {
      const branchId = parseInt(req.params.id);
      const { series } = createSequenceSchema.parse(req.body);
      const sequence = await sequenceRepository.create(branchId, series);
      res.status(201).json(sequence);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  }
};


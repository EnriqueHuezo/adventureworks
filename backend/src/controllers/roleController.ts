import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { roleRepository } from '../repositories/roleRepository';

export const roleController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const roles = await roleRepository.findAll();
      res.json(roles);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};


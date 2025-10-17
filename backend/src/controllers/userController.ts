import { Response } from 'express';
import { z } from 'zod';
import { AuthRequest } from '../middleware/auth';
import { userService } from '../services/userService';

const createUserSchema = z.object({
  email: z.string().email('Email inválido'),
  username: z.string().min(3, 'Usuario debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  fullName: z.string().min(1, 'Nombre completo requerido'),
  branchId: z.number().optional(),
  roleIds: z.array(z.number()).min(1, 'Debe asignar al menos un rol')
});

const updateUserSchema = z.object({
  email: z.string().email('Email inválido').optional(),
  username: z.string().min(3, 'Usuario debe tener al menos 3 caracteres').optional(),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres').optional(),
  fullName: z.string().min(1, 'Nombre completo requerido').optional(),
  branchId: z.number().nullable().optional()
});

const updateRolesSchema = z.object({
  roleIds: z.array(z.number()).min(1, 'Debe asignar al menos un rol')
});

const updateStatusSchema = z.object({
  isActive: z.boolean()
});

export const userController = {
  async getAll(req: AuthRequest, res: Response) {
    try {
      const filters = {
        q: req.query.q as string,
        role: req.query.role as string,
        status: req.query.status === 'true' ? true : req.query.status === 'false' ? false : undefined,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        size: req.query.size ? parseInt(req.query.size as string) : 25
      };
      const result = await userService.getAll(filters);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getById(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const user = await userService.getById(id);
      res.json(user);
    } catch (error: any) {
      res.status(404).json({ error: error.message });
    }
  },

  async create(req: AuthRequest, res: Response) {
    try {
      const data = createUserSchema.parse(req.body);
      const user = await userService.create(data);
      res.status(201).json(user);
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
      const data = updateUserSchema.parse(req.body);
      const user = await userService.update(id, data);
      res.json(user);
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
      await userService.delete(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateRoles(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { roleIds } = updateRolesSchema.parse(req.body);
      const user = await userService.updateRoles(id, roleIds);
      res.json(user);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  },

  async updateStatus(req: AuthRequest, res: Response) {
    try {
      const id = parseInt(req.params.id);
      const { isActive } = updateStatusSchema.parse(req.body);
      const user = await userService.updateStatus(id, isActive);
      res.json(user);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      }
      res.status(500).json({ error: error.message });
    }
  }
};


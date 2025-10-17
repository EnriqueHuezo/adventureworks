import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  // Validation errors (Zod)
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.errors.map(e => ({
        field: e.path.join('.'),
        message: e.message
      }))
    });
  }

  // Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({
        error: 'Ya existe un registro con ese valor único',
        field: err.meta?.target
      });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({
        error: 'Registro no encontrado'
      });
    }
  }

  // Default error
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
}


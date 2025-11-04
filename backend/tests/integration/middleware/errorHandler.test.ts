import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { errorHandler } from '../../../src/middleware/errorHandler';

// Fake routes to trigger errors
const app = express();

app.get('/zod', () => {
  throw new ZodError([
    {
      path: ['email'],
      message: 'Correo inválido',
      code: 'custom'
    }
  ]);
});

app.get('/p2002', () => {
  throw new Prisma.PrismaClientKnownRequestError('Duplicate', { code: 'P2002', clientVersion: '1.0', meta: { target: ['email'] } });
});

app.get('/p9999', () => {
  throw new Prisma.PrismaClientKnownRequestError('Unknown error', { code: 'P9999', clientVersion: '1.0', meta: { target: ['email'] } });
});

app.get('/p2025', () => {
  throw new Prisma.PrismaClientKnownRequestError('Not found', { code: 'P2025', clientVersion: '1.0' });
});

app.get('/generic', () => {
  throw new Error('Algo salió mal');
});

app.use(errorHandler);

describe('errorHandler middleware', () => {
  let originalEnv: string | undefined;
  beforeAll(() => {
    originalEnv = process.env.NODE_ENV;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('handles ZodError', async () => {
    const res = await request(app).get('/zod');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Error de validación');
    expect(res.body.details[0]).toEqual({
      field: 'email',
      message: 'Correo inválido'
    });
  });

  it('handles Prisma P2002 unique constraint error', async () => {
    const res = await request(app).get('/p2002');
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('Ya existe un registro con ese valor único');
    expect(res.body.field).toEqual(['email']);
  });

  it('handles Prisma P2025 not found error', async () => {
    const res = await request(app).get('/p2025');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Registro no encontrado');
  });

  it('handles Prisma P9999 unknown error', async () => {
    const res = await request(app).get('/p9999');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error interno del servidor');
  });

  it('handles generic server error', async () => {
    const res = await request(app).get('/generic');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error interno del servidor');
  });

  it('handles generic server error in development env', async () => {
    process.env.NODE_ENV = 'development';
    const res = await request(app).get('/generic');
    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Error interno del servidor');
    expect(res.body.message).toBe('Algo salió mal');
  });
});

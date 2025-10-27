import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';
import * as seedModule from '../../prisma/seed';

export let prisma: PrismaClient;

beforeAll(async () => {
  prisma = new PrismaClient();
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

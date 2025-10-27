import { afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

export let prisma: PrismaClient;

afterAll(async () => {
  await prisma.$disconnect();
});

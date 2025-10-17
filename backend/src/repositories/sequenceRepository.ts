import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sequenceRepository = {
  async getNextValue(branchId: number, series: string): Promise<number> {
    return prisma.$transaction(async (tx) => {
      // Lock the sequence row for update
      const sequence = await tx.sequence.findUnique({
        where: {
          branchId_series: {
            branchId,
            series
          }
        }
      });

      if (!sequence) {
        // Create if doesn't exist
        const newSeq = await tx.sequence.create({
          data: {
            branchId,
            series,
            nextValue: 2
          }
        });
        return 1;
      }

      const currentValue = sequence.nextValue;

      // Increment for next time
      await tx.sequence.update({
        where: {
          branchId_series: {
            branchId,
            series
          }
        },
        data: {
          nextValue: currentValue + 1
        }
      });

      return currentValue;
    });
  },

  async findByBranch(branchId: number) {
    return prisma.sequence.findMany({
      where: { branchId }
    });
  },

  async create(branchId: number, series: string) {
    return prisma.sequence.create({
      data: {
        branchId,
        series,
        nextValue: 1
      }
    });
  }
};


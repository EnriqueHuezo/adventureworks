import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export interface UserFilters {
  q?: string;
  role?: string;
  status?: boolean;
  page?: number;
  size?: number;
}

export const userRepository = {
  async findAll(filters: UserFilters) {
    const { q, role, status, page = 1, size = 25 } = filters;
    const skip = (page - 1) * size;

    const where: Prisma.UserWhereInput = {};

    if (q) {
      where.OR = [
        { username: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { fullName: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (status !== undefined) {
      where.isActive = status;
    }

    if (role) {
      where.roles = {
        some: {
          role: {
            name: role as any
          }
        }
      };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: size,
        include: {
          roles: {
            include: {
              role: true
            }
          },
          branch: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    return { users, total, page, size };
  },

  async findById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        branch: true
      }
    });
  },

  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  },

  async findByUsername(username: string) {
    return prisma.user.findUnique({
      where: { username },
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  },

  async create(data: Prisma.UserCreateInput) {
    return prisma.user.create({
      data,
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  },

  async update(id: number, data: Prisma.UserUpdateInput) {
    return prisma.user.update({
      where: { id },
      data,
      include: {
        roles: {
          include: {
            role: true
          }
        }
      }
    });
  },

  async delete(id: number) {
    return prisma.user.delete({ where: { id } });
  },

  async updateRoles(userId: number, roleIds: number[]) {
    await prisma.userRole.deleteMany({ where: { userId } });
    await prisma.userRole.createMany({
      data: roleIds.map(roleId => ({ userId, roleId }))
    });
  },

  async updateStatus(id: number, isActive: boolean) {
    return prisma.user.update({
      where: { id },
      data: { isActive }
    });
  }
};

